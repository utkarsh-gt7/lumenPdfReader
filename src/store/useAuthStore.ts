import { create } from 'zustand';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
  type User,
} from 'firebase/auth';
import type { UserProfile } from '@/types';
import { getFirebaseAuth } from '@/services/firebase';
import { getOrCreateProfile } from '@/services/repository/profile';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  status: AuthStatus;
  error: string | null;

  /** Subscribe to Firebase auth changes. Returns the unsubscriber. */
  init: () => () => void;

  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  setProfile: (profile: UserProfile | null) => void;
}

/** Translate a Firebase Auth error code to something a user can read. */
function readableAuthError(code: string | undefined): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Email or password is incorrect.';
    case 'auth/user-not-found':
      return 'No account exists for that email.';
    case 'auth/email-already-in-use':
      return 'An account with that email already exists.';
    case 'auth/weak-password':
      return 'Please choose a longer, stronger password (at least 6 characters).';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Allow popups for this site and try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorised for sign-in. Add it under Firebase Authentication → Settings → Authorized domains.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is disabled. Enable it under Firebase Authentication → Sign-in method.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with that email under a different sign-in provider.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}

/**
 * Log the original Firebase error to the console so unknown codes are
 * still discoverable in production via DevTools, even though the user
 * sees the friendly fallback toast.
 */
function logFirebaseAuthError(scope: string, err: unknown): void {
  const e = err as { code?: string; message?: string };
  console.error(`[auth:${scope}]`, e?.code ?? '(no code)', e?.message ?? err);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  status: 'idle',
  error: null,

  init: () => {
    set({ status: 'loading' });
    const unsub = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      if (!user) {
        set({ user: null, profile: null, status: 'unauthenticated' });
        return;
      }
      try {
        const profile = await getOrCreateProfile({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
        set({ user, profile, status: 'authenticated', error: null });
      } catch (err) {
        set({
          user,
          profile: null,
          status: 'authenticated',
          error: err instanceof Error ? err.message : 'Failed to load profile.',
        });
      }
    });
    return unsub;
  },

  signInWithGoogle: async () => {
    set({ error: null });
    try {
      await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
    } catch (err) {
      logFirebaseAuthError('signInWithGoogle', err);
      const code = (err as { code?: string }).code;
      const message = readableAuthError(code);
      set({ error: message });
      throw new Error(message);
    }
  },

  signInWithEmail: async (email, password) => {
    set({ error: null });
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    } catch (err) {
      logFirebaseAuthError('signInWithEmail', err);
      const code = (err as { code?: string }).code;
      const message = readableAuthError(code);
      set({ error: message });
      throw new Error(message);
    }
  },

  signUpWithEmail: async (email, password, displayName) => {
    set({ error: null });
    try {
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      if (displayName) {
        await fbUpdateProfile(cred.user, { displayName });
      }
    } catch (err) {
      logFirebaseAuthError('signUpWithEmail', err);
      const code = (err as { code?: string }).code;
      const message = readableAuthError(code);
      set({ error: message });
      throw new Error(message);
    }
  },

  signOut: async () => {
    await fbSignOut(getFirebaseAuth());
    set({ user: null, profile: null, status: 'unauthenticated' });
  },

  setProfile: (profile) => set({ profile, user: get().user }),
}));

export { readableAuthError };
