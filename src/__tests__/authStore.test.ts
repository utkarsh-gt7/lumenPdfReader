import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readableAuthError, useAuthStore } from '@/store/useAuthStore';

const onAuthStateChangedMock = vi.fn();
const signInWithPopupMock = vi.fn();
const signInWithEmailAndPasswordMock = vi.fn();
const createUserWithEmailAndPasswordMock = vi.fn();
const signOutMock = vi.fn();
const updateProfileMock = vi.fn();
const getOrCreateProfileMock = vi.fn();

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => onAuthStateChangedMock(...args),
  signInWithPopup: (...args: unknown[]) => signInWithPopupMock(...args),
  signInWithEmailAndPassword: (...args: unknown[]) => signInWithEmailAndPasswordMock(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) =>
    createUserWithEmailAndPasswordMock(...args),
  signOut: (...args: unknown[]) => signOutMock(...args),
  updateProfile: (...args: unknown[]) => updateProfileMock(...args),
  GoogleAuthProvider: class {},
}));

vi.mock('@/services/firebase', () => ({
  getFirebaseAuth: () => ({}),
}));

vi.mock('@/services/repository/profile', () => ({
  getOrCreateProfile: (...args: unknown[]) => getOrCreateProfileMock(...args),
}));

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    profile: null,
    status: 'idle',
    error: null,
  });
  onAuthStateChangedMock.mockReset();
  signInWithPopupMock.mockReset();
  signInWithEmailAndPasswordMock.mockReset();
  createUserWithEmailAndPasswordMock.mockReset();
  signOutMock.mockReset();
  updateProfileMock.mockReset();
  getOrCreateProfileMock.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('readableAuthError', () => {
  it.each([
    ['auth/invalid-credential', /incorrect/],
    ['auth/wrong-password', /incorrect/],
    ['auth/user-not-found', /No account/],
    ['auth/email-already-in-use', /already exists/],
    ['auth/weak-password', /stronger password/],
    ['auth/popup-closed-by-user', /cancelled/],
    ['auth/network-request-failed', /Network/],
    ['auth/some-future-code', /Sign-in failed/],
    [undefined, /Sign-in failed/],
  ])('translates %s into a friendly message', (code, pattern) => {
    expect(readableAuthError(code)).toMatch(pattern);
  });
});

describe('useAuthStore', () => {
  it('init flips status to loading and registers an auth listener', () => {
    onAuthStateChangedMock.mockReturnValue(() => undefined);
    useAuthStore.getState().init();
    expect(useAuthStore.getState().status).toBe('loading');
    expect(onAuthStateChangedMock).toHaveBeenCalled();
  });

  it('marks the user unauthenticated when Firebase reports no user', async () => {
    let cb!: (user: unknown) => void;
    onAuthStateChangedMock.mockImplementation((_auth, fn) => {
      cb = fn as (u: unknown) => void;
      return () => undefined;
    });
    useAuthStore.getState().init();
    cb(null);
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('loads a profile on successful auth', async () => {
    const fakeUser = {
      uid: 'u1',
      email: 'a@b.c',
      displayName: 'A',
      photoURL: null,
    };
    const fakeProfile = {
      uid: 'u1',
      email: 'a@b.c',
      displayName: 'A',
      photoURL: null,
      createdAt: 0,
      onboardingShownFor: [],
      settings: { darkMode: true, fontScale: 1 },
    };
    let cb!: (user: unknown) => void;
    onAuthStateChangedMock.mockImplementation((_auth, fn) => {
      cb = fn as (u: unknown) => void;
      return () => undefined;
    });
    getOrCreateProfileMock.mockResolvedValue(fakeProfile);

    useAuthStore.getState().init();
    await cb(fakeUser);

    const s = useAuthStore.getState();
    expect(s.status).toBe('authenticated');
    expect(s.user).toBe(fakeUser);
    expect(s.profile).toEqual(fakeProfile);
  });

  it('still authenticates if profile load fails, surfacing the error', async () => {
    let cb!: (user: unknown) => void;
    onAuthStateChangedMock.mockImplementation((_auth, fn) => {
      cb = fn as (u: unknown) => void;
      return () => undefined;
    });
    getOrCreateProfileMock.mockRejectedValue(new Error('Firestore offline'));
    useAuthStore.getState().init();
    await cb({ uid: 'u1', email: null, displayName: null, photoURL: null });
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().error).toMatch(/Firestore offline/);
  });

  it('signInWithGoogle delegates to firebase and resets error on success', async () => {
    signInWithPopupMock.mockResolvedValue({});
    useAuthStore.setState({ error: 'old error' });
    await useAuthStore.getState().signInWithGoogle();
    expect(useAuthStore.getState().error).toBeNull();
    expect(signInWithPopupMock).toHaveBeenCalled();
  });

  it('signInWithGoogle wraps Firebase errors with a readable message', async () => {
    signInWithPopupMock.mockRejectedValue({ code: 'auth/popup-closed-by-user' });
    await expect(useAuthStore.getState().signInWithGoogle()).rejects.toThrow(/cancelled/);
    expect(useAuthStore.getState().error).toMatch(/cancelled/);
  });

  it('signInWithEmail forwards to Firebase', async () => {
    signInWithEmailAndPasswordMock.mockResolvedValue({});
    await useAuthStore.getState().signInWithEmail('a@b.c', 'pass1234');
    expect(signInWithEmailAndPasswordMock).toHaveBeenCalledWith(
      expect.anything(),
      'a@b.c',
      'pass1234',
    );
  });

  it('signInWithEmail surfaces a wrong-password error', async () => {
    signInWithEmailAndPasswordMock.mockRejectedValue({ code: 'auth/wrong-password' });
    await expect(useAuthStore.getState().signInWithEmail('a', 'b')).rejects.toThrow(/incorrect/);
  });

  it('signUpWithEmail creates the account and updates the displayName when given', async () => {
    const fakeUser = { uid: 'u' };
    createUserWithEmailAndPasswordMock.mockResolvedValue({ user: fakeUser });
    updateProfileMock.mockResolvedValue(undefined);

    await useAuthStore.getState().signUpWithEmail('a@b.c', 'pw123456', 'Aria');

    expect(createUserWithEmailAndPasswordMock).toHaveBeenCalled();
    expect(updateProfileMock).toHaveBeenCalledWith(fakeUser, { displayName: 'Aria' });
  });

  it('signUpWithEmail skips updateProfile when no displayName is supplied', async () => {
    createUserWithEmailAndPasswordMock.mockResolvedValue({ user: {} });
    await useAuthStore.getState().signUpWithEmail('a@b.c', 'pw123456');
    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it('signUpWithEmail wraps weak-password errors', async () => {
    createUserWithEmailAndPasswordMock.mockRejectedValue({ code: 'auth/weak-password' });
    await expect(useAuthStore.getState().signUpWithEmail('a@b.c', '1')).rejects.toThrow(
      /stronger password/,
    );
  });

  it('signOut clears local state', async () => {
    signOutMock.mockResolvedValue(undefined);
    useAuthStore.setState({
      user: { uid: 'u' } as never,
      profile: {} as never,
      status: 'authenticated',
    });
    await useAuthStore.getState().signOut();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().profile).toBeNull();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('setProfile updates the profile in place', () => {
    const profile = {
      uid: 'u',
      email: null,
      displayName: null,
      photoURL: null,
      createdAt: 0,
      onboardingShownFor: [],
      settings: { darkMode: true, fontScale: 1 },
    };
    useAuthStore.getState().setProfile(profile);
    expect(useAuthStore.getState().profile).toEqual(profile);
  });
});
