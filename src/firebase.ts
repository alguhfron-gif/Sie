/// <reference types="vite/client" />
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';
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

let dbService: Firestore;
try {
  const customDbId = firebaseConfigJson.firestoreDatabaseId;
  const firestoreSettings = {
    experimentalForceLongPolling: true,
  };
  if (customDbId && customDbId !== '(default)') {
    dbService = initializeFirestore(app, firestoreSettings, customDbId);
  } else {
    dbService = initializeFirestore(app, firestoreSettings);
  }
} catch (error) {
  console.warn("Firestore initialization with settings fallback, using getFirestore:", error);
  try {
    const customDbId = firebaseConfigJson.firestoreDatabaseId;
    dbService = customDbId && customDbId !== '(default)' ? getFirestore(app, customDbId) : getFirestore(app);
  } catch (e) {
    dbService = getFirestore(app);
  }
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
