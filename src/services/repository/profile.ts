import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { DeviceType, UserProfile } from '@/types';
import { getDb } from '../firebase';
import { paths } from './paths';

/**
 * The shape persisted in Firestore. We use {@link serverTimestamp} for
 * `createdAt` so multiple devices end up with a consistent value, but the
 * domain {@link UserProfile} just exposes a number — {@link toProfile} maps
 * between them.
 */
interface PersistedProfile {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: { toMillis(): number } | number;
  onboardingShownFor?: DeviceType[];
  settings?: { darkMode?: boolean; fontScale?: number };
}

function toProfile(uid: string, raw: PersistedProfile): UserProfile {
  const createdAt =
    typeof raw.createdAt === 'number'
      ? raw.createdAt
      : raw.createdAt && typeof raw.createdAt === 'object'
        ? raw.createdAt.toMillis()
        : Date.now();
  return {
    uid,
    email: raw.email ?? null,
    displayName: raw.displayName ?? null,
    photoURL: raw.photoURL ?? null,
    createdAt,
    onboardingShownFor: raw.onboardingShownFor ?? [],
    settings: {
      darkMode: raw.settings?.darkMode ?? true,
      fontScale: raw.settings?.fontScale ?? 1,
    },
  };
}

/** Fetch a profile, creating a default one on first sign-in. */
export async function getOrCreateProfile(params: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<UserProfile> {
  const ref = doc(getDb(), paths.user(params.uid));
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return toProfile(params.uid, snap.data() as PersistedProfile);
  }

  const seed: PersistedProfile = {
    email: params.email,
    displayName: params.displayName,
    photoURL: params.photoURL,
    createdAt: Date.now(),
    onboardingShownFor: [],
    settings: { darkMode: true, fontScale: 1 },
  };
  await setDoc(ref, { ...seed, createdAt: serverTimestamp() });
  return toProfile(params.uid, seed);
}

/** Mark the gesture onboarding as completed for a particular device class. */
export async function markOnboardingShown(uid: string, device: DeviceType): Promise<void> {
  const ref = doc(getDb(), paths.user(uid));
  const snap = await getDoc(ref);
  const current = (snap.data()?.onboardingShownFor ?? []) as DeviceType[];
  if (current.includes(device)) return;
  await updateDoc(ref, { onboardingShownFor: [...current, device] });
}

export async function updateSettings(
  uid: string,
  settings: Partial<UserProfile['settings']>,
): Promise<void> {
  const ref = doc(getDb(), paths.user(uid));
  const updates: Record<string, unknown> = {};
  if (settings.darkMode !== undefined) updates['settings.darkMode'] = settings.darkMode;
  if (settings.fontScale !== undefined) updates['settings.fontScale'] = settings.fontScale;
  if (Object.keys(updates).length === 0) return;
  await updateDoc(ref, updates);
}
