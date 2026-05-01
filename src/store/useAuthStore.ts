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
      return 'Sign-in was cancelled.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return 'Sign-in failed. Please try again.';
  }
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
