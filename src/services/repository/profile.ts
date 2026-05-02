import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  BRIGHTNESS_MAX,
  BRIGHTNESS_MIN,
  DEFAULT_SETTINGS,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
  type DeviceType,
  type ReadingFont,
  type Theme,
  type UserProfile,
  type UserSettings,
} from '@/types';
import { getDb } from '../firebase';
import { paths } from './paths';

/**
 * The shape persisted in Firestore. We accept both the legacy
 * `darkMode: boolean` from earlier app versions and the current rich
 * settings object — {@link toProfile} migrates the former into the latter.
 */
interface PersistedProfile {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: { toMillis(): number } | number;
  onboardingShownFor?: DeviceType[];
  settings?: {
    /** Legacy — replaced by `theme`. Kept here so old documents migrate. */
    darkMode?: boolean;
    theme?: Theme;
    brightness?: number;
    focusMode?: boolean;
    fontFamily?: ReadingFont;
    fontScale?: number;
  };
}

const VALID_THEMES: ReadonlyArray<Theme> = ['light', 'paper', 'dark'];
const VALID_FONT_FAMILIES: ReadonlyArray<ReadingFont> = ['serif', 'sans'];

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Hydrate a {@link UserSettings} object from raw Firestore data, applying
 * defaults for missing fields and migrating the legacy `darkMode` boolean
 * to the new `theme` enum on the way through.
 */
export function hydrateSettings(
  raw: PersistedProfile['settings'] | undefined,
): UserSettings {
  if (!raw) return { ...DEFAULT_SETTINGS };

  const theme: Theme =
    raw.theme && VALID_THEMES.includes(raw.theme)
      ? raw.theme
      : raw.darkMode === true
        ? 'dark'
        : raw.darkMode === false
          ? 'light'
          : DEFAULT_SETTINGS.theme;

  const fontFamily: ReadingFont =
    raw.fontFamily && VALID_FONT_FAMILIES.includes(raw.fontFamily)
      ? raw.fontFamily
      : DEFAULT_SETTINGS.fontFamily;

  return {
    theme,
    brightness:
      typeof raw.brightness === 'number'
        ? clamp(raw.brightness, BRIGHTNESS_MIN, BRIGHTNESS_MAX)
        : DEFAULT_SETTINGS.brightness,
    focusMode: typeof raw.focusMode === 'boolean' ? raw.focusMode : DEFAULT_SETTINGS.focusMode,
    fontFamily,
    fontScale:
      typeof raw.fontScale === 'number'
        ? clamp(raw.fontScale, FONT_SCALE_MIN, FONT_SCALE_MAX)
        : DEFAULT_SETTINGS.fontScale,
  };
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
    settings: hydrateSettings(raw.settings),
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
    settings: { ...DEFAULT_SETTINGS },
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

/**
 * Patch one or more settings. Each field is validated/clamped before being
 * written, so callers can pass user-supplied numbers without sanitising.
 */
export async function updateSettings(
  uid: string,
  settings: Partial<UserSettings>,
): Promise<void> {
  const ref = doc(getDb(), paths.user(uid));
  const updates: Record<string, unknown> = {};

  if (settings.theme !== undefined && VALID_THEMES.includes(settings.theme)) {
    updates['settings.theme'] = settings.theme;
    // Keep the legacy boolean roughly in sync so any older client still
    // honours the choice. Cleared once we're confident no clients read it.
    updates['settings.darkMode'] = settings.theme === 'dark';
  }
  if (settings.brightness !== undefined) {
    updates['settings.brightness'] = clamp(settings.brightness, BRIGHTNESS_MIN, BRIGHTNESS_MAX);
  }
  if (settings.focusMode !== undefined) {
    updates['settings.focusMode'] = settings.focusMode;
  }
  if (settings.fontFamily !== undefined && VALID_FONT_FAMILIES.includes(settings.fontFamily)) {
    updates['settings.fontFamily'] = settings.fontFamily;
  }
  if (settings.fontScale !== undefined) {
    updates['settings.fontScale'] = clamp(settings.fontScale, FONT_SCALE_MIN, FONT_SCALE_MAX);
  }

  if (Object.keys(updates).length === 0) return;
  await updateDoc(ref, updates);
}
