/// <reference types="vite/client" />
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  Firestore,
  doc,
  SetOptions,
  DocumentReference,
  DocumentSnapshot,
  Query,
  QuerySnapshot,
  DocumentData,
  FirestoreError,
  Unsubscribe,
} from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfigJson from '../firebase-applet-config.json';

// Helper to prioritize explicit config from firebase-applet-config.json over environment fallbacks
const getConfigValue = (jsonVal: string | undefined, envVal: string | undefined, fallback: string = ''): string => {
  if (jsonVal && jsonVal.trim() !== '' && !jsonVal.includes('isi_') && !jsonVal.includes('your_')) {
    return jsonVal.trim();
  }
  if (envVal && envVal.trim() !== '' && !envVal.includes('isi_') && !envVal.includes('your_')) {
    return envVal.trim();
  }
  return fallback;
};

// Default Firebase Client Configuration (prioritizes user's explicit firebase-applet-config.json)
export const firebaseConfig = {
  apiKey: getConfigValue(firebaseConfigJson.apiKey, import.meta.env.VITE_FIREBASE_API_KEY),
  authDomain: getConfigValue(firebaseConfigJson.authDomain, import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: getConfigValue(firebaseConfigJson.projectId, import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: getConfigValue(firebaseConfigJson.storageBucket, import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: getConfigValue(firebaseConfigJson.messagingSenderId, import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: getConfigValue(firebaseConfigJson.appId, import.meta.env.VITE_FIREBASE_APP_ID),
};

// Initialize Firebase App safely
let firebaseApp: FirebaseApp;
try {
  firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.warn('Failed to initialize Firebase with current config, falling back to existing app or default initialization:', error);
  firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const app = firebaseApp;

// Initialize Services safely
let authService: Auth;
try {
  authService = getAuth(app);
} catch (error) {
  console.warn('Firebase Auth initialization error:', error);
  authService = getAuth(app);
}
export const auth = authService;

const isBrowser = typeof window !== 'undefined';
const firestoreDatabaseId =
  firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId.trim() !== ''
    ? firebaseConfigJson.firestoreDatabaseId.trim()
    : '(default)';

let dbService: Firestore;
try {
  dbService = initializeFirestore(
    app,
    {
      ignoreUndefinedProperties: true,
    },
    firestoreDatabaseId
  );
} catch (error) {
  console.warn('Firestore initialization fallback:', error);
  dbService = getFirestore(app, firestoreDatabaseId);
}
export const db = dbService;

let storageService: FirebaseStorage;
try {
  storageService = getStorage(app);
} catch (error) {
  console.warn('Firebase Storage initialization error:', error);
  storageService = getStorage(app);
}
export const storage = storageService;

// ============================================================================
// STATELESS FIRESTORE REST SYNC ENGINE
// Eliminates WebChannelConnection RPC 'Listen'/'Write' stream transport errors,
// 10s backend timeouts, and 'missing stream token' errors while maintaining
// real-time cross-tab & multi-device synchronization via Firestore REST API.
// ============================================================================

interface CachedDocEntry {
  id: string;
  data: Record<string, any>;
}

interface CachedPathSnapshot {
  type: 'document' | 'collection';
  exists: boolean;
  docData?: Record<string, any>;
  docs?: CachedDocEntry[];
  fetchedAt: number;
}

interface SubscriptionEntry {
  ref: DocumentReference<any> | Query<any>;
  path: string;
  type: 'document' | 'collection';
  onNext: (snapshot: any) => void;
  onError?: (error: FirestoreError) => void;
  lastFingerprint: string | null;
}

let probePromise: Promise<boolean> | null = null;
let lastProbeTimestamp = 0;
let lastProbeResult = true;
let lastUserActivityAt = Date.now();
let syncSchedulerTimer: ReturnType<typeof setInterval> | null = null;

const PROBE_TTL_MS = 20000;
const PROBE_TIMEOUT_MS = 4000;
const HIGH_FREQ_POLL_MS = 30000;
const STANDARD_POLL_MS = 60000;
const IDLE_POLL_MS = 180000;
const IDLE_THRESHOLD_MS = 180000;
const FOCUS_REFRESH_COOLDOWN_MS = 15000;

const restSnapshotCache = new Map<string, CachedPathSnapshot>();
const inFlightRestFetches = new Map<string, Promise<any | null>>();
const activeSubscriptions = new Map<string, Set<SubscriptionEntry>>();
const pendingNotifyTimers = new Map<string, ReturnType<typeof setTimeout>>();

let syncBroadcastChannel: BroadcastChannel | null = null;
if (isBrowser && typeof BroadcastChannel !== 'undefined') {
  try {
    syncBroadcastChannel = new BroadcastChannel('sie_firestore_sync');
    syncBroadcastChannel.onmessage = (event) => {
      const changedPath = event?.data?.path;
      if (typeof changedPath === 'string' && changedPath.length > 0) {
        void refreshPathAndNotify(changedPath, true);
        const parent = getParentCollectionPath(changedPath);
        if (parent) {
          void refreshPathAndNotify(parent, true);
        }
      }
    };
  } catch {
    syncBroadcastChannel = null;
  }
}

function getFirestoreRestBaseUrl(): string {
  const project = firebaseConfig.projectId;
  const dbName = encodeURIComponent(firestoreDatabaseId);
  return `https://firestore.googleapis.com/v1/projects/${project}/databases/${dbName}/documents`;
}

function getFirestoreRestCommitUrl(): string {
  const project = firebaseConfig.projectId;
  const dbName = encodeURIComponent(firestoreDatabaseId);
  return `https://firestore.googleapis.com/v1/projects/${project}/databases/${dbName}/documents:commit`;
}

function getFullDocumentResourceName(path: string): string {
  const project = firebaseConfig.projectId;
  return `projects/${project}/databases/${firestoreDatabaseId}/documents/${path}`;
}

function getParentCollectionPath(docPath: string): string | null {
  const idx = docPath.lastIndexOf('/');
  if (idx <= 0) return null;
  return docPath.slice(0, idx);
}

function getDocIdFromPath(docPath: string): string {
  const idx = docPath.lastIndexOf('/');
  return idx >= 0 ? docPath.slice(idx + 1) : docPath;
}

function decodeFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('booleanValue' in val) return val.booleanValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    const values = val.arrayValue?.values;
    return Array.isArray(values) ? values.map(decodeFirestoreValue) : [];
  }
  if ('mapValue' in val) {
    const fields = val.mapValue?.fields || {};
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      obj[k] = decodeFirestoreValue(v);
    }
    return obj;
  }
  return val;
}

function decodeFirestoreFields(fields?: Record<string, any>): Record<string, any> {
  if (!fields || typeof fields !== 'object') return {};
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    result[k] = decodeFirestoreValue(v);
  }
  return result;
}

function encodeFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return { nullValue: null };
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.filter((v) => v !== undefined).map(encodeFirestoreValue),
      },
    };
  }
  if (typeof val === 'object') {
    return {
      mapValue: {
        fields: encodeFirestoreFields(val),
      },
    };
  }
  return { stringValue: String(val) };
}

function encodeFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  if (!obj || typeof obj !== 'object') return fields;
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    fields[k] = encodeFirestoreValue(v);
  }
  return fields;
}

function formatFieldPathForMask(field: string): string {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field) ? field : `\`${field.replace(/`/g, '\\`')}\``;
}

async function getOptionalAuthHeader(): Promise<Record<string, string>> {
  try {
    const token = await auth?.currentUser?.getIdToken?.();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {}
  return {};
}

function buildDocumentSnapshot(path: string, exists: boolean, data?: Record<string, any>): any {
  const id = getDocIdFromPath(path);
  let docRef: any;
  try {
    docRef = doc(db, path);
  } catch {
    docRef = { id, path, type: 'document' };
  }
  const cloned = data ? { ...data } : undefined;
  return {
    id,
    ref: docRef,
    metadata: { fromCache: false, hasPendingWrites: false },
    exists: () => exists,
    data: () => (exists ? cloned : undefined),
  };
}

function buildCollectionSnapshot(collectionPath: string, entries: CachedDocEntry[]): any {
  const docSnaps = entries.map((entry) => {
    let docRef: any;
    try {
      docRef = doc(db, collectionPath, entry.id);
    } catch {
      docRef = { id: entry.id, path: `${collectionPath}/${entry.id}`, type: 'document' };
    }
    const cloned = { ...entry.data };
    return {
      id: entry.id,
      ref: docRef,
      exists: () => true,
      data: () => cloned,
    };
  });
  return {
    empty: docSnaps.length === 0,
    size: docSnaps.length,
    docs: docSnaps,
    metadata: { fromCache: false, hasPendingWrites: false },
    forEach: (cb: (docSnap: any) => void) => docSnaps.forEach(cb),
  };
}

function buildSnapshotFromCache(path: string, type: 'document' | 'collection'): any | null {
  const cached = restSnapshotCache.get(path);
  if (!cached) return null;
  if (type === 'document') {
    return buildDocumentSnapshot(path, cached.exists, cached.docData);
  }
  return buildCollectionSnapshot(path, cached.docs || []);
}

function computeSnapshotFingerprint(type: 'document' | 'collection', snap: any): string {
  try {
    if (type === 'document') {
      return JSON.stringify({
        exists: Boolean(snap?.exists?.()),
        data: snap?.exists?.() ? snap.data?.() : null,
      });
    }
    const items = Array.isArray(snap?.docs)
      ? snap.docs
          .map((d: any) => ({ id: d.id, data: d.data?.() || {} }))
          .sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)))
      : [];
    return JSON.stringify(items);
  } catch {
    return String(Date.now());
  }
}

function makePermissionError(message: string): FirestoreError {
  return {
    name: 'FirebaseError',
    code: 'permission-denied',
    message,
  } as FirestoreError;
}

function scheduleSubscriberEmit(path: string, type: 'document' | 'collection') {
  const subs = activeSubscriptions.get(path);
  if (!subs || subs.size === 0) return;

  const key = `${type}:${path}`;
  if (pendingNotifyTimers.has(key)) return;

  const timer = setTimeout(() => {
    pendingNotifyTimers.delete(key);
    const snap = buildSnapshotFromCache(path, type);
    if (!snap) return;
    const fp = computeSnapshotFingerprint(type, snap);
    const currentSubs = activeSubscriptions.get(path);
    if (!currentSubs) return;
    currentSubs.forEach((entry) => {
      if (entry.lastFingerprint === fp) return;
      entry.lastFingerprint = fp;
      try {
        entry.onNext(snap);
      } catch (err) {
        console.warn('Error in Firestore subscriber callback:', err);
      }
    });
  }, 16);

  pendingNotifyTimers.set(key, timer);
}

function updateCacheOnDocWrite(docPath: string, data: Record<string, any>, merge: boolean) {
  const docId = getDocIdFromPath(docPath);
  const existingDoc = restSnapshotCache.get(docPath);
  const nextDocData =
    merge && existingDoc?.exists && existingDoc.docData
      ? { ...existingDoc.docData, ...data }
      : { ...data };

  restSnapshotCache.set(docPath, {
    type: 'document',
    exists: true,
    docData: nextDocData,
    fetchedAt: Date.now(),
  });
  scheduleSubscriberEmit(docPath, 'document');

  const parentPath = getParentCollectionPath(docPath);
  if (parentPath) {
    const existingCol = restSnapshotCache.get(parentPath);
    const currentDocs = existingCol?.docs ? [...existingCol.docs] : [];
    const idx = currentDocs.findIndex((d) => d.id === docId);
    if (idx >= 0) {
      const mergedData = merge ? { ...currentDocs[idx].data, ...data } : { ...data };
      currentDocs[idx] = { id: docId, data: mergedData };
    } else {
      currentDocs.push({ id: docId, data: nextDocData });
    }
    restSnapshotCache.set(parentPath, {
      type: 'collection',
      exists: true,
      docs: currentDocs,
      fetchedAt: Date.now(),
    });
    scheduleSubscriberEmit(parentPath, 'collection');
  }
}

function updateCacheOnDocDelete(docPath: string) {
  const docId = getDocIdFromPath(docPath);
  restSnapshotCache.set(docPath, {
    type: 'document',
    exists: false,
    docData: undefined,
    fetchedAt: Date.now(),
  });
  scheduleSubscriberEmit(docPath, 'document');

  const parentPath = getParentCollectionPath(docPath);
  if (parentPath) {
    const existingCol = restSnapshotCache.get(parentPath);
    if (existingCol?.docs) {
      const nextDocs = existingCol.docs.filter((d) => d.id !== docId);
      restSnapshotCache.set(parentPath, {
        type: 'collection',
        exists: true,
        docs: nextDocs,
        fetchedAt: Date.now(),
      });
      scheduleSubscriberEmit(parentPath, 'collection');
    }
  }
}

function broadcastPathChange(path: string) {
  if (!syncBroadcastChannel) return;
  try {
    syncBroadcastChannel.postMessage({ path, ts: Date.now() });
  } catch {}
}

export async function fetchSnapshotViaRest(ref: DocumentReference<any> | Query<any>): Promise<any | null> {
  const refAny = ref as any;
  const path: string | undefined = refAny?.path;
  const type: string | undefined = refAny?.type;
  if (!path || !firebaseConfig.projectId || !firebaseConfig.apiKey) return null;

  const flightKey = `${type}:${path}`;
  const existingFlight = inFlightRestFetches.get(flightKey);
  if (existingFlight) return existingFlight;

  const fetchPromise = (async () => {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 8000) : null;

    try {
      const baseUrl = getFirestoreRestBaseUrl();
      const authHeaders = await getOptionalAuthHeader();

      if (type === 'document') {
        const url = `${baseUrl}/${path}?key=${encodeURIComponent(firebaseConfig.apiKey)}`;
        const res = await fetch(url, {
          method: 'GET',
          cache: 'no-store',
          headers: { ...authHeaders },
          ...(controller ? { signal: controller.signal } : {}),
        });

        if (res.status === 404) {
          restSnapshotCache.set(path, {
            type: 'document',
            exists: false,
            docData: undefined,
            fetchedAt: Date.now(),
          });
          lastProbeResult = true;
          lastProbeTimestamp = Date.now();
          return buildDocumentSnapshot(path, false);
        }

        if (res.status === 401 || res.status === 403) {
          const text = await res.text().catch(() => 'Missing or insufficient permissions');
          throw makePermissionError(text || 'Missing or insufficient permissions.');
        }

        if (!res.ok) return null;
        const json = await res.json();
        const decoded = decodeFirestoreFields(json.fields);
        restSnapshotCache.set(path, {
          type: 'document',
          exists: true,
          docData: decoded,
          fetchedAt: Date.now(),
        });
        lastProbeResult = true;
        lastProbeTimestamp = Date.now();
        return buildDocumentSnapshot(path, true, decoded);
      }

      if (type === 'collection') {
        const allDocs: CachedDocEntry[] = [];
        let pageToken: string | undefined = undefined;
        let pageCount = 0;

        do {
          const params = new URLSearchParams();
          params.set('pageSize', '500');
          params.set('key', firebaseConfig.apiKey);
          if (pageToken) {
            params.set('pageToken', pageToken);
          }

          const url = `${baseUrl}/${path}?${params.toString()}`;
          const res = await fetch(url, {
            method: 'GET',
            cache: 'no-store',
            headers: { ...authHeaders },
            ...(controller ? { signal: controller.signal } : {}),
          });

          if (res.status === 401 || res.status === 403) {
            const text = await res.text().catch(() => 'Missing or insufficient permissions');
            throw makePermissionError(text || 'Missing or insufficient permissions.');
          }

          if (!res.ok) return null;
          const json = await res.json();
          const rawDocs: any[] = Array.isArray(json.documents) ? json.documents : [];
          for (const d of rawDocs) {
            const parts = String(d.name || '').split('/');
            const id = parts[parts.length - 1] || '';
            const decoded = decodeFirestoreFields(d.fields);
            allDocs.push({ id, data: decoded });
          }
          pageToken = typeof json.nextPageToken === 'string' && json.nextPageToken ? json.nextPageToken : undefined;
          pageCount += 1;
        } while (pageToken && pageCount < 10);

        restSnapshotCache.set(path, {
          type: 'collection',
          exists: true,
          docs: allDocs,
          fetchedAt: Date.now(),
        });
        lastProbeResult = true;
        lastProbeTimestamp = Date.now();
        return buildCollectionSnapshot(path, allDocs);
      }

      return null;
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        throw err;
      }
      return null;
    } finally {
      if (timer) clearTimeout(timer);
      inFlightRestFetches.delete(flightKey);
    }
  })();

  inFlightRestFetches.set(flightKey, fetchPromise);
  return fetchPromise;
}

async function writeDocViaRest(
  ref: DocumentReference<any>,
  data: Record<string, any>,
  merge = false,
  timeoutMs = 6000
): Promise<{ ok: boolean; status: number; errorText?: string }> {
  const path = (ref as any)?.path;
  if (!path || !firebaseConfig.projectId || !firebaseConfig.apiKey) {
    return { ok: false, status: 0, errorText: 'Invalid Firestore configuration' };
  }

  const cleanData = data && typeof data === 'object' ? data : {};
  const keys = Object.keys(cleanData).filter((k) => cleanData[k] !== undefined);
  if (merge && keys.length === 0) {
    return { ok: true, status: 200 };
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const params = new URLSearchParams();
    params.set('key', firebaseConfig.apiKey);
    if (merge && keys.length > 0) {
      keys.forEach((k) => params.append('updateMask.fieldPaths', formatFieldPathForMask(k)));
    }

    const url = `${getFirestoreRestBaseUrl()}/${path}?${params.toString()}`;
    const authHeaders = await getOptionalAuthHeader();
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        fields: encodeFirestoreFields(cleanData),
      }),
      ...(controller ? { signal: controller.signal } : {}),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      return { ok: false, status: res.status, errorText };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    return { ok: false, status: 0, errorText: err instanceof Error ? err.message : String(err) };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function deleteDocViaRest(
  ref: DocumentReference<any>,
  timeoutMs = 6000
): Promise<{ ok: boolean; status: number; errorText?: string }> {
  const path = (ref as any)?.path;
  if (!path || !firebaseConfig.projectId || !firebaseConfig.apiKey) {
    return { ok: false, status: 0, errorText: 'Invalid Firestore configuration' };
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const url = `${getFirestoreRestBaseUrl()}/${path}?key=${encodeURIComponent(firebaseConfig.apiKey)}`;
    const authHeaders = await getOptionalAuthHeader();
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { ...authHeaders },
      ...(controller ? { signal: controller.signal } : {}),
    });

    if (!res.ok && res.status !== 404) {
      const errorText = await res.text().catch(() => '');
      return { ok: false, status: res.status, errorText };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    return { ok: false, status: 0, errorText: err instanceof Error ? err.message : String(err) };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function refreshPathAndNotify(path: string, force = false): Promise<void> {
  const subs = activeSubscriptions.get(path);
  if (!subs || subs.size === 0) return;

  const firstEntry = subs.values().next().value as SubscriptionEntry | undefined;
  if (!firstEntry) return;

  const cached = restSnapshotCache.get(path);
  if (!force && cached && Date.now() - cached.fetchedAt < 4000) {
    return;
  }

  try {
    const snap = await fetchSnapshotViaRest(firstEntry.ref);
    if (!snap) return;
    const fp = computeSnapshotFingerprint(firstEntry.type, snap);
    const currentSubs = activeSubscriptions.get(path);
    if (!currentSubs) return;
    currentSubs.forEach((entry) => {
      if (entry.lastFingerprint === fp) return;
      entry.lastFingerprint = fp;
      try {
        entry.onNext(snap);
      } catch (err) {
        console.warn('Error in Firestore snapshot listener:', err);
      }
    });
  } catch (err: any) {
    if (err?.code === 'permission-denied') {
      const currentSubs = activeSubscriptions.get(path);
      currentSubs?.forEach((entry) => {
        if (entry.onError) entry.onError(err);
      });
    }
  }
}

function getPollIntervalForPath(path: string): number {
  const isIdle = Date.now() - lastUserActivityAt > IDLE_THRESHOLD_MS;
  if (isIdle) return IDLE_POLL_MS;
  if (path === 'settings/milad_logo' || path === 'user_presence') {
    return HIGH_FREQ_POLL_MS;
  }
  return STANDARD_POLL_MS;
}

function refreshStaleSubscriptions(minAgeMs: number) {
  if (!isBrowser) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

  const now = Date.now();
  activeSubscriptions.forEach((subs, path) => {
    if (subs.size === 0) return;
    const cached = restSnapshotCache.get(path);
    const age = cached ? now - cached.fetchedAt : Infinity;
    if (age >= minAgeMs) {
      void refreshPathAndNotify(path, true);
    }
  });
}

function ensureSyncScheduler() {
  if (!isBrowser || syncSchedulerTimer) return;
  syncSchedulerTimer = setInterval(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;

    const now = Date.now();
    activeSubscriptions.forEach((subs, path) => {
      if (subs.size === 0) return;
      const interval = getPollIntervalForPath(path);
      const cached = restSnapshotCache.get(path);
      const age = cached ? now - cached.fetchedAt : Infinity;
      if (age >= interval) {
        void refreshPathAndNotify(path, true);
      }
    });
  }, 15000);
}

function stopSyncSchedulerIfUnused() {
  if (activeSubscriptions.size === 0 && syncSchedulerTimer) {
    clearInterval(syncSchedulerTimer);
    syncSchedulerTimer = null;
  }
}

if (isBrowser) {
  const bumpActivity = () => {
    lastUserActivityAt = Date.now();
  };
  window.addEventListener('pointerdown', bumpActivity, { passive: true });
  window.addEventListener('keydown', bumpActivity, { passive: true });

  window.addEventListener('online', () => {
    lastProbeTimestamp = 0;
    lastProbeResult = true;
    refreshStaleSubscriptions(5000);
  });

  window.addEventListener('focus', () => {
    lastUserActivityAt = Date.now();
    refreshStaleSubscriptions(FOCUS_REFRESH_COOLDOWN_MS);
  });

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        lastUserActivityAt = Date.now();
        refreshStaleSubscriptions(FOCUS_REFRESH_COOLDOWN_MS);
      }
    });
  }
}

export function isFirestoreWatchHealthy(): boolean {
  return lastProbeResult;
}

export async function resilientFirestoreWrite<T>(
  writeOp: () => Promise<T>,
  timeoutMs = 5000
): Promise<T | void> {
  if (!isBrowser) return writeOp();
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<void>((resolve) => {
    timer = setTimeout(() => {
      timedOut = true;
      resolve();
    }, timeoutMs);
  });
  return Promise.race([
    writeOp()
      .catch((err) => {
        if (timedOut) return;
        throw err;
      })
      .finally(() => {
        if (timer) clearTimeout(timer);
      }),
    timeoutPromise,
  ]);
}

export async function resilientSetDoc<T extends DocumentData>(
  ref: DocumentReference<T>,
  data: T | Partial<T>,
  options?: SetOptions,
  timeoutMs = 6000
): Promise<void> {
  const path = (ref as any)?.path as string | undefined;
  const isMerge = Boolean((options as any)?.merge);
  const cleanData = data && typeof data === 'object' ? (data as Record<string, any>) : {};

  if (path) {
    updateCacheOnDocWrite(path, cleanData, isMerge);
    broadcastPathChange(path);
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }

  const res = await writeDocViaRest(ref, cleanData, isMerge, timeoutMs);
  if (!res.ok && (res.status === 401 || res.status === 403 || res.status === 400)) {
    throw makePermissionError(res.errorText || `Firestore write error (HTTP ${res.status})`);
  }
}

export async function resilientDeleteDoc(
  ref: DocumentReference<any>,
  timeoutMs = 6000
): Promise<void> {
  const path = (ref as any)?.path as string | undefined;
  if (path) {
    updateCacheOnDocDelete(path);
    broadcastPathChange(path);
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }

  const res = await deleteDocViaRest(ref, timeoutMs);
  if (!res.ok && (res.status === 401 || res.status === 403 || res.status === 400)) {
    throw makePermissionError(res.errorText || `Firestore delete error (HTTP ${res.status})`);
  }
}

export async function resilientBatchSetDocs(
  entries: Array<{ ref: DocumentReference<any>; data: Record<string, any>; merge?: boolean }>
): Promise<void> {
  if (!entries || entries.length === 0) return;

  const affectedParents = new Set<string>();
  entries.forEach(({ ref, data, merge }) => {
    const path = (ref as any)?.path as string | undefined;
    if (path) {
      updateCacheOnDocWrite(path, data, Boolean(merge));
      const parent = getParentCollectionPath(path);
      if (parent) affectedParents.add(parent);
    }
  });
  affectedParents.forEach((p) => broadcastPathChange(p));

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) return;

  const BATCH_SIZE = 450;
  const authHeaders = await getOptionalAuthHeader();

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const chunk = entries.slice(i, i + BATCH_SIZE);
    const writes = chunk
      .map(({ ref, data, merge }) => {
        const path = (ref as any)?.path as string | undefined;
        if (!path) return null;
        const keys = Object.keys(data || {}).filter((k) => data[k] !== undefined);
        const writeObj: Record<string, any> = {
          update: {
            name: getFullDocumentResourceName(path),
            fields: encodeFirestoreFields(data || {}),
          },
        };
        if (merge && keys.length > 0) {
          writeObj.updateMask = { fieldPaths: keys.map(formatFieldPathForMask) };
        }
        return writeObj;
      })
      .filter(Boolean);

    if (writes.length === 0) continue;

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 10000) : null;
    try {
      const url = `${getFirestoreRestCommitUrl()}?key=${encodeURIComponent(firebaseConfig.apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ writes }),
        ...(controller ? { signal: controller.signal } : {}),
      });
      if (!res.ok && (res.status === 401 || res.status === 403 || res.status === 400)) {
        const text = await res.text().catch(() => '');
        throw makePermissionError(text || `Firestore batch commit error (HTTP ${res.status})`);
      }
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}

export async function resilientBatchDeleteDocs(
  refs: Array<DocumentReference<any>>
): Promise<void> {
  if (!refs || refs.length === 0) return;

  const affectedParents = new Set<string>();
  refs.forEach((ref) => {
    const path = (ref as any)?.path as string | undefined;
    if (path) {
      updateCacheOnDocDelete(path);
      const parent = getParentCollectionPath(path);
      if (parent) affectedParents.add(parent);
    }
  });
  affectedParents.forEach((p) => broadcastPathChange(p));

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) return;

  const BATCH_SIZE = 450;
  const authHeaders = await getOptionalAuthHeader();

  for (let i = 0; i < refs.length; i += BATCH_SIZE) {
    const chunk = refs.slice(i, i + BATCH_SIZE);
    const writes = chunk
      .map((ref) => {
        const path = (ref as any)?.path as string | undefined;
        if (!path) return null;
        return { delete: getFullDocumentResourceName(path) };
      })
      .filter(Boolean);

    if (writes.length === 0) continue;

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 10000) : null;
    try {
      const url = `${getFirestoreRestCommitUrl()}?key=${encodeURIComponent(firebaseConfig.apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ writes }),
        ...(controller ? { signal: controller.signal } : {}),
      });
      if (!res.ok && (res.status === 401 || res.status === 403 || res.status === 400)) {
        const text = await res.text().catch(() => '');
        throw makePermissionError(text || `Firestore batch delete error (HTTP ${res.status})`);
      }
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}

export async function ensureFirestoreOnline(): Promise<boolean> {
  if (!isBrowser) return true;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    lastProbeResult = false;
    lastProbeTimestamp = Date.now();
    return false;
  }
  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
    return false;
  }

  const now = Date.now();
  if (lastProbeTimestamp > 0 && now - lastProbeTimestamp < PROBE_TTL_MS) {
    return lastProbeResult;
  }

  if (probePromise) return probePromise;

  probePromise = (async () => {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS) : null;
    try {
      const url = `${getFirestoreRestBaseUrl()}/settings/milad_logo?key=${encodeURIComponent(firebaseConfig.apiKey)}`;
      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        ...(controller ? { signal: controller.signal } : {}),
      });
      const reachable = res.status > 0;
      lastProbeResult = reachable;
      lastProbeTimestamp = Date.now();
      return reachable;
    } catch {
      lastProbeResult = false;
      lastProbeTimestamp = Date.now();
      return false;
    } finally {
      if (timeout) clearTimeout(timeout);
      probePromise = null;
    }
  })();

  return probePromise;
}

export function resilientOnSnapshot<T = DocumentData>(
  reference: DocumentReference<T>,
  onNext: (snapshot: DocumentSnapshot<T>) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe;
export function resilientOnSnapshot<T = DocumentData>(
  query: Query<T>,
  onNext: (snapshot: QuerySnapshot<T>) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe;
export function resilientOnSnapshot(
  ref: DocumentReference<any> | Query<any>,
  onNext: (snapshot: any) => void,
  onError?: (error: FirestoreError) => void
): Unsubscribe {
  const refAny = ref as any;
  const path: string = refAny?.path || '';
  const type: 'document' | 'collection' = refAny?.type === 'document' ? 'document' : 'collection';

  if (!path) {
    return () => {};
  }

  const entry: SubscriptionEntry = {
    ref,
    path,
    type,
    onNext,
    onError,
    lastFingerprint: null,
  };

  let set = activeSubscriptions.get(path);
  if (!set) {
    set = new Set();
    activeSubscriptions.set(path, set);
  }
  set.add(entry);
  ensureSyncScheduler();

  let disposed = false;

  const init = async () => {
    // Serve in-memory cached snapshot immediately if available
    const cachedSnap = buildSnapshotFromCache(path, type);
    if (cachedSnap && !disposed) {
      const fp = computeSnapshotFingerprint(type, cachedSnap);
      entry.lastFingerprint = fp;
      try {
        entry.onNext(cachedSnap);
      } catch {}
    }

    const reachable = await ensureFirestoreOnline();
    if (disposed || !reachable) return;

    await refreshPathAndNotify(path, false);
  };

  void init();

  return () => {
    disposed = true;
    const subs = activeSubscriptions.get(path);
    if (subs) {
      subs.delete(entry);
      if (subs.size === 0) {
        activeSubscriptions.delete(path);
      }
    }
    stopSyncSchedulerIfUnused();
  };
}

// Helper for Firestore Operation Types & Structured Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function logFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Warning/Notice: ', JSON.stringify(errInfo));
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default app;
