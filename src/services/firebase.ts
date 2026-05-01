import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

/**
 * Resolves the Firebase Web config from Vite environment variables. Returns
 * `null` if any required variable is missing — the rest of the app inspects
 * this to render a friendly setup-required screen instead of crashing.
 */
function resolveConfig() {
  const cfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  const missing = Object.entries(cfg)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) {
    return { ok: false as const, missing };
  }
  return { ok: true as const, config: cfg };
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

/** True if every required Firebase env var is present. */
export function isFirebaseConfigured(): boolean {
  return resolveConfig().ok;
}

/** Returns the names of any missing Firebase env vars (for diagnostics). */
export function missingFirebaseConfig(): string[] {
  const r = resolveConfig();
  return r.ok ? [] : r.missing;
}

function ensureApp(): FirebaseApp {
  if (appInstance) return appInstance;
  const r = resolveConfig();
  if (!r.ok) {
    throw new Error(
      `Firebase is not configured. Missing env vars: ${r.missing.join(', ')}. ` +
        'Copy .env.example → .env.local and fill in your Firebase Web config.',
    );
  }
  appInstance = initializeApp(r.config);
  return appInstance;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) authInstance = getAuth(ensureApp());
  return authInstance;
}

export function getDb(): Firestore {
  if (!dbInstance) dbInstance = getFirestore(ensureApp());
  return dbInstance;
}

export function getBucket(): FirebaseStorage {
  if (!storageInstance) storageInstance = getStorage(ensureApp());
  return storageInstance;
}

/**
 * Reset cached singletons. Used by tests so each test can swap in its own
 * Firebase mock without polluting the next test.
 */
export function _resetFirebaseForTests(): void {
  appInstance = null;
  authInstance = null;
  dbInstance = null;
  storageInstance = null;
}
