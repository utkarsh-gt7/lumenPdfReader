import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'test' })),
}));
vi.mock('firebase/auth', () => ({ getAuth: vi.fn(() => ({ name: 'auth' })) }));
vi.mock('firebase/firestore', () => ({ getFirestore: vi.fn(() => ({ name: 'db' })) }));
vi.mock('firebase/storage', () => ({ getStorage: vi.fn(() => ({ name: 'storage' })) }));

const ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

const env = import.meta.env as unknown as Record<string, string>;

let originalEnv: Record<string, string>;

beforeEach(async () => {
  originalEnv = { ...env };
  vi.resetModules();
});

afterEach(async () => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) {
      delete env[key];
    } else {
      env[key] = originalEnv[key];
    }
  }
  const mod = await import('@/services/firebase');
  mod._resetFirebaseForTests();
});

function setAllEnv(value: string) {
  for (const key of ENV_KEYS) env[key] = value;
}

function clearAllEnv() {
  for (const key of ENV_KEYS) env[key] = '';
}

describe('firebase service config', () => {
  it('reports unconfigured when every var is empty', async () => {
    clearAllEnv();
    const { isFirebaseConfigured, missingFirebaseConfig } = await import('@/services/firebase');
    expect(isFirebaseConfigured()).toBe(false);
    // The repo names the config fields after the SDK shape, e.g. "apiKey"
    // rather than the env-var name "VITE_FIREBASE_API_KEY".
    expect(missingFirebaseConfig()).toEqual(
      expect.arrayContaining([
        'apiKey',
        'authDomain',
        'projectId',
        'storageBucket',
        'messagingSenderId',
        'appId',
      ]),
    );
  });

  it('reports a partial set of missing keys', async () => {
    setAllEnv('present');
    env.VITE_FIREBASE_API_KEY = '';
    const { isFirebaseConfigured, missingFirebaseConfig } = await import('@/services/firebase');
    expect(isFirebaseConfigured()).toBe(false);
    expect(missingFirebaseConfig()).toEqual(['apiKey']);
  });

  it('reports configured when all vars are set', async () => {
    setAllEnv('value');
    const { isFirebaseConfigured, missingFirebaseConfig } = await import('@/services/firebase');
    expect(isFirebaseConfigured()).toBe(true);
    expect(missingFirebaseConfig()).toEqual([]);
  });

  it('lazily initializes auth/db/storage exactly once', async () => {
    setAllEnv('value');
    const { getFirebaseAuth, getDb, getBucket } = await import('@/services/firebase');
    const auth = getFirebaseAuth();
    const auth2 = getFirebaseAuth();
    expect(auth).toBe(auth2);
    expect(getDb()).toBeDefined();
    expect(getBucket()).toBeDefined();
  });

  it('throws a friendly error when ensureApp is called before configuration', async () => {
    clearAllEnv();
    const { getFirebaseAuth } = await import('@/services/firebase');
    expect(() => getFirebaseAuth()).toThrow(/not configured/);
  });
});
