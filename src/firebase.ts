/// <reference types="vite/client" />
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Helper to sanitize env values and fallback if invalid or placeholder
const getEnvValue = (val: string | undefined, fallback: string): string => {
  if (!val || val.trim() === '' || val.includes('isi_') || val.includes('your_')) {
    return fallback;
  }
  return val.trim();
};

// Default Firebase Client Configuration
export const firebaseConfig = {
  apiKey: getEnvValue(import.meta.env.VITE_FIREBASE_API_KEY, "AIzaSyAUDZGvUNhWAd_sk8loWDkgHEtUiRj5ESA"),
  authDomain: getEnvValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, "sie-penganugrahan.firebaseapp.com"),
  projectId: getEnvValue(import.meta.env.VITE_FIREBASE_PROJECT_ID, "sie-penganugrahan"),
  storageBucket: getEnvValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, "sie-penganugrahan.firebasestorage.app"),
  messagingSenderId: getEnvValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, "794946122065"),
  appId: getEnvValue(import.meta.env.VITE_FIREBASE_APP_ID, "1:794946122065:web:a59afe46edaa6938e96370")
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
  dbService = getFirestore(app);
} catch (error) {
  console.warn("Firestore initialization error:", error);
  dbService = getFirestore(app);
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

