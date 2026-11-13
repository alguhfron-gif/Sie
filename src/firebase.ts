/// <reference types="vite/client" />
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  Firestore,
  onSnapshot,
  setDoc,
  deleteDoc,
  SetOptions,
  disableNetwork,
  enableNetwork,
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
  appId: getConfigValue(firebaseConfigJson.appId, import.meta.env.VITE_FIREBASE_APP_ID)
};

// Initialize Firebase App safely
let firebaseApp: FirebaseApp;
try {
  firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.warn("Failed to initialize Firebase with current config, falling back to existing app or default initialization:", error);
  firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export const app = firebaseApp;

// Initialize Services safely
let authService: Auth;
try {
  authService = getAuth(app);
} catch (error) {
  console.warn("Firebase Auth initialization error:", error);
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
      ...(isBrowser
        ? {
            experimentalForceLongPolling: true,
          }
        : {}),
      ignoreUndefinedProperties: true,
    },
    firestoreDatabaseId
  );
} catch (error) {
  console.warn("Firestore initialization fallback:", error);
  dbService = getFirestore(app, firestoreDatabaseId);
}
export const db = dbService;

let storageService: FirebaseStorage;
try {
  storageService = getStorage(app);
} catch (error) {
  console.warn("Firebase Storage initialization error:", error);
  storageService = getStorage(app);
}
export const storage = storageService;

// ============================================================================
// RESILIENT FIRESTORE CONNECTION & WATCH-STREAM SAFETY GUARD
// Prevents WebChannel/long-poll hangs from triggering SDK 10s console.error
// while automatically restoring sync when connectivity recovers.
// ============================================================================

let probePromise: Promise<boolean> | null = null;
let lastProbeTimestamp = 0;
let lastProbeResult = true;
let watchStreamConfirmed = false;
let watchStreamStalled = false;
let watchStallCount = 0;
let networkDisabledByGuard = false;
let writeStreamBroken = false;
let watchSafetyTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const watchStallListeners = new Set<() => void>();
const onlineRecoveryListeners = new Set<() => void>();

const PROBE_TTL_MS = 20000;
const PROBE_TIMEOUT_MS = 3500;
const WATCH_SAFETY_TIMEOUT_MS = 7000;
const MAX_WATCH_STALL_RETRIES = 2;

function getFirestoreRestBaseUrl(): string {
  const project = firebaseConfig.projectId;
  const dbName = encodeURIComponent(firestoreDatabaseId);
  return `https://firestore.googleapis.com/v1/projects/${project}/databases/${dbName}/documents`;
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

export async function fetchSnapshotViaRest(ref: DocumentReference<any> | Query<any>): Promise<any | null> {
  const refAny = ref as any;
  const path: string | undefined = refAny?.path;
  const type: string | undefined = refAny?.type;
  if (!path || !firebaseConfig.projectId || !firebaseConfig.apiKey) return null;

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), 5000) : null;

  try {
    const baseUrl = getFirestoreRestBaseUrl();
    const url = `${baseUrl}/${path}?${type === 'collection' ? 'pageSize=500&' : ''}key=${encodeURIComponent(firebaseConfig.apiKey)}`;
    const res = await fetch(url, {
      method: 'GET',
      ...(controller ? { signal: controller.signal } : {}),
    });

    if (type === 'document') {
      if (res.status === 404) {
        return {
          id: refAny.id,
          metadata: { fromCache: false, hasPendingWrites: false },
          exists: () => false,
          data: () => undefined,
        };
      }
      if (!res.ok) return null;
      const json = await res.json();
      const decoded = decodeFirestoreFields(json.fields);
      return {
        id: refAny.id,
        metadata: { fromCache: false, hasPendingWrites: false },
        exists: () => true,
        data: () => decoded,
      };
    }

    if (type === 'collection') {
      if (!res.ok) return null;
      const json = await res.json();
      const rawDocs: any[] = Array.isArray(json.documents) ? json.documents : [];
      const docSnaps = rawDocs.map((d) => {
        const parts = String(d.name || '').split('/');
        const id = parts[parts.length - 1] || '';
        const decoded = decodeFirestoreFields(d.fields);
        return {
          id,
          exists: () => true,
          data: () => decoded,
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

    return null;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
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

async function getOptionalAuthHeader(): Promise<Record<string, string>> {
  try {
    const token = await auth?.currentUser?.getIdToken?.();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {}
  return {};
}

async function writeDocViaRest(
  ref: DocumentReference<any>,
  data: Record<string, any>,
  merge = false
): Promise<boolean> {
  const path = (ref as any)?.path;
  if (!path || !firebaseConfig.projectId || !firebaseConfig.apiKey) return false;

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), 5000) : null;

  try {
    const cleanData = data && typeof data === 'object' ? data : {};
    const keys = Object.keys(cleanData).filter((k) => cleanData[k] !== undefined);
    const params = new URLSearchParams();
    params.set('key', firebaseConfig.apiKey);
    if (merge && keys.length > 0) {
      keys.forEach((k) => params.append('updateMask.fieldPaths', k));
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
    return res.ok;
  } catch {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function deleteDocViaRest(ref: DocumentReference<any>): Promise<boolean> {
  const path = (ref as any)?.path;
  if (!path || !firebaseConfig.projectId || !firebaseConfig.apiKey) return false;

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), 5000) : null;

  try {
    const url = `${getFirestoreRestBaseUrl()}/${path}?key=${encodeURIComponent(firebaseConfig.apiKey)}`;
    const authHeaders = await getOptionalAuthHeader();
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { ...authHeaders },
      ...(controller ? { signal: controller.signal } : {}),
    });
    return res.ok || res.status === 404;
  } catch {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function isTransientStreamError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err || '')).toLowerCase();
  const code = String((err as any)?.code || '').toLowerCase();
  return (
    msg.includes('missing stream token') ||
    msg.includes('stream token') ||
    msg.includes('unavailable') ||
    msg.includes('offline') ||
    msg.includes('aborted') ||
    msg.includes('network') ||
    code === 'unavailable' ||
    code === 'aborted' ||
    code === 'cancelled'
  );
}

async function safeDisableNetwork() {
  if (!isBrowser || networkDisabledByGuard) return;
  networkDisabledByGuard = true;
  try {
    await disableNetwork(db);
  } catch {}
}

async function safeEnableNetwork() {
  if (!isBrowser || !networkDisabledByGuard) return;
  networkDisabledByGuard = false;
  try {
    await enableNetwork(db);
  } catch {}
}

function scheduleReconnectProbe(reason: 'offline' | 'stall' = 'offline') {
  if (!isBrowser || reconnectTimer) return;
  if (reason === 'stall' && watchStallCount > MAX_WATCH_STALL_RETRIES) {
    // Watch streaming appears blocked in this network; avoid repeated 10s stalls until browser 'online' fires
    return;
  }
  const delayMs = reason === 'stall' ? 60000 * Math.max(1, watchStallCount) : 25000;
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    lastProbeTimestamp = 0;
    const ok = await ensureFirestoreOnline();
    if (ok) {
      watchStreamStalled = false;
      watchStreamConfirmed = false;
      writeStreamBroken = false;
      await safeEnableNetwork();
      onlineRecoveryListeners.forEach((fn) => fn());
    }
  }, delayMs);
}

if (isBrowser) {
  window.addEventListener('online', async () => {
    lastProbeTimestamp = 0;
    watchStreamStalled = false;
    watchStreamConfirmed = false;
    watchStallCount = 0;
    writeStreamBroken = false;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    const ok = await ensureFirestoreOnline();
    if (ok) {
      await safeEnableNetwork();
      onlineRecoveryListeners.forEach((fn) => fn());
    }
  });
}

export function isFirestoreWatchHealthy(): boolean {
  return lastProbeResult && !watchStreamStalled;
}

export async function resilientFirestoreWrite<T>(
  writeOp: () => Promise<T>,
  timeoutMs = 3500
): Promise<T | void> {
  if (!isBrowser) return writeOp();
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }
  if (watchStreamStalled || !lastProbeResult) {
    // Avoid hanging indefinitely when watch/network has been disabled
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
  timeoutMs = 3500
): Promise<void> {
  if (!isBrowser) {
    if (options) {
      await setDoc(ref, data as any, options);
    } else {
      await setDoc(ref, data as any);
    }
    return;
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }

  const isMerge = Boolean((options as any)?.merge);

  // If Watch/Write stream is stalled or previously returned stream-token errors, use stateless REST write
  if (watchStreamStalled || !lastProbeResult || writeStreamBroken) {
    await writeDocViaRest(ref, data as Record<string, any>, isMerge);
    return;
  }

  try {
    let timedOut = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<void>((resolve) => {
      timer = setTimeout(() => {
        timedOut = true;
        resolve();
      }, timeoutMs);
    });
    const opPromise = (options ? setDoc(ref, data as any, options) : setDoc(ref, data as any))
      .catch((err) => {
        if (timedOut) {
          if (isTransientStreamError(err)) {
            const msg = (err instanceof Error ? err.message : String(err || '')).toLowerCase();
            if (msg.includes('stream token')) {
              writeStreamBroken = true;
            }
          }
          return;
        }
        throw err;
      })
      .finally(() => {
        if (timer) clearTimeout(timer);
      });
    await Promise.race([opPromise, timeoutPromise]);
    if (timedOut) {
      await writeDocViaRest(ref, data as Record<string, any>, isMerge);
    }
  } catch (err) {
    if (isTransientStreamError(err)) {
      const msg = (err instanceof Error ? err.message : String(err || '')).toLowerCase();
      if (msg.includes('stream token')) {
        writeStreamBroken = true;
      }
      const restOk = await writeDocViaRest(ref, data as Record<string, any>, isMerge);
      if (restOk) return;
    }
    throw err;
  }
}

export async function resilientDeleteDoc(
  ref: DocumentReference<any>,
  timeoutMs = 3500
): Promise<void> {
  if (!isBrowser) {
    await deleteDoc(ref);
    return;
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return;
  }

  if (watchStreamStalled || !lastProbeResult || writeStreamBroken) {
    await deleteDocViaRest(ref);
    return;
  }

  try {
    let timedOut = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<void>((resolve) => {
      timer = setTimeout(() => {
        timedOut = true;
        resolve();
      }, timeoutMs);
    });
    const opPromise = deleteDoc(ref)
      .catch((err) => {
        if (timedOut) {
          if (isTransientStreamError(err)) {
            const msg = (err instanceof Error ? err.message : String(err || '')).toLowerCase();
            if (msg.includes('stream token')) {
              writeStreamBroken = true;
            }
          }
          return;
        }
        throw err;
      })
      .finally(() => {
        if (timer) clearTimeout(timer);
      });
    await Promise.race([opPromise, timeoutPromise]);
    if (timedOut) {
      await deleteDocViaRest(ref);
    }
  } catch (err) {
    if (isTransientStreamError(err)) {
      const msg = (err instanceof Error ? err.message : String(err || '')).toLowerCase();
      if (msg.includes('stream token')) {
        writeStreamBroken = true;
      }
      const restOk = await deleteDocViaRest(ref);
      if (restOk) return;
    }
    throw err;
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
      // Any HTTP response from Firestore backend (200, 403, 404) confirms backend reachability
      const reachable = res.status > 0;
      lastProbeResult = reachable;
      lastProbeTimestamp = Date.now();
      return reachable;
    } catch {
      lastProbeResult = false;
      lastProbeTimestamp = Date.now();
      safeDisableNetwork().catch(() => {});
      scheduleReconnectProbe('offline');
      return false;
    } finally {
      if (timeout) clearTimeout(timeout);
      probePromise = null;
    }
  })();

  return probePromise;
}

function triggerWatchStall() {
  if (watchStreamStalled) return;
  watchStreamStalled = true;
  watchStallCount += 1;
  if (watchSafetyTimer) {
    clearTimeout(watchSafetyTimer);
    watchSafetyTimer = null;
  }
  // Detach hung watch streams BEFORE SDK's 10s OnlineStateTracker error fires
  watchStallListeners.forEach((cb) => cb());
  safeDisableNetwork().catch(() => {});
  scheduleReconnectProbe('stall');
}

function startWatchSafetyMonitor() {
  if (!isBrowser || watchStreamConfirmed || watchStreamStalled || watchSafetyTimer) return;
  watchSafetyTimer = setTimeout(() => {
    watchSafetyTimer = null;
    if (watchStreamConfirmed) return;
    triggerWatchStall();
  }, WATCH_SAFETY_TIMEOUT_MS);
}

function markWatchHealthy() {
  watchStreamConfirmed = true;
  watchStreamStalled = false;
  watchStallCount = 0;
  if (watchSafetyTimer) {
    clearTimeout(watchSafetyTimer);
    watchSafetyTimer = null;
  }
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
  let disposed = false;
  let activeUnsub: Unsubscribe | null = null;
  let deliveredInitialViaRest = false;
  let deliveredCachedOnce = false;

  const detachStream = () => {
    if (activeUnsub) {
      try {
        activeUnsub();
      } catch {}
      activeUnsub = null;
    }
  };

  const handleWatchStall = async () => {
    detachStream();
    if (!disposed && !deliveredInitialViaRest) {
      const restSnap = await fetchSnapshotViaRest(ref);
      if (restSnap && !disposed) {
        deliveredInitialViaRest = true;
        onNext(restSnap);
      }
    }
  };

  const attach = async () => {
    if (disposed) return;
    const reachable = await ensureFirestoreOnline();
    if (disposed) return;

    if (!reachable) {
      return;
    }

    if (watchStreamStalled) {
      if (!deliveredInitialViaRest) {
        const restSnap = await fetchSnapshotViaRest(ref);
        if (restSnap && !disposed) {
          deliveredInitialViaRest = true;
          onNext(restSnap);
        }
      }
      return;
    }

    try {
      await safeEnableNetwork();
      if (disposed) return;

      startWatchSafetyMonitor();
      activeUnsub = onSnapshot(
        ref as any,
        { includeMetadataChanges: true },
        (snap: any) => {
          const fromCache = Boolean(snap?.metadata?.fromCache);
          if (!fromCache) {
            markWatchHealthy();
            deliveredInitialViaRest = true;
            if (!disposed) onNext(snap);
            return;
          }
          // Cache-only emission: deliver once for responsiveness without marking watch stream healthy
          if (!disposed && !deliveredCachedOnce && !deliveredInitialViaRest) {
            deliveredCachedOnce = true;
            onNext(snap);
          }
        },
        (err: FirestoreError) => {
          if (err?.code === 'unavailable') {
            triggerWatchStall();
            return;
          }
          if (!disposed && onError) onError(err);
        }
      );
    } catch (err) {
      if (!disposed && onError) onError(err as FirestoreError);
    }
  };

  watchStallListeners.add(handleWatchStall);
  onlineRecoveryListeners.add(attach);
  attach();

  return () => {
    disposed = true;
    watchStallListeners.delete(handleWatchStall);
    onlineRecoveryListeners.delete(attach);
    detachStream();
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
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
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
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default app;
