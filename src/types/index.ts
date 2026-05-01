/**
 * Domain types shared across the app. Kept free of any UI / Firebase SDK
 * imports so they stay portable and easy to test.
 */

/** A device class — the gesture onboarding tour adapts to this. */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/** Allowed marker / highlight colors. The values map to Tailwind theme colors. */
export const HIGHLIGHT_COLORS = ['yellow', 'green', 'blue', 'pink', 'purple', 'orange'] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

/**
 * A normalized rectangle (all values 0..1, relative to the rendered page).
 * This makes highlights resolution-independent — they re-render correctly
 * whether the page is at 80%, 100%, or 250% zoom.
 */
export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
  /** Device types where the gesture onboarding tour has already played. */
  onboardingShownFor: DeviceType[];
  /** UI preferences */
  settings: {
    darkMode: boolean;
    fontScale: number;
  };
}

export interface Book {
  id: string;
  title: string;
  filename: string;
  /** Path inside Firebase Storage, e.g. users/{uid}/books/{id}.pdf */
  storagePath: string;
  /** Cached download URL — refreshed lazily if it expires. */
  downloadUrl: string;
  /** Total page count, populated after the PDF first loads. */
  totalPages: number;
  /** The page the user is currently reading — synced across devices. */
  currentPage: number;
  /** Last-read timestamp (ms since epoch). Used to sort the library. */
  lastReadAt: number;
  /** When the book was added to the library. */
  addedAt: number;
  /** File size in bytes, displayed in the library card. */
  sizeBytes: number;
}

export interface Bookmark {
  id: string;
  bookId: string;
  page: number;
  /** Optional user-provided label. */
  label?: string;
  createdAt: number;
}

export interface Highlight {
  id: string;
  bookId: string;
  page: number;
  /** The text that was selected — for searching and exporting later. */
  text: string;
  color: HighlightColor;
  /**
   * One rectangle per text-line of the selection. Coordinates are normalized
   * to the page (0..1). Multi-line selections produce multiple rects.
   */
  rects: NormalizedRect[];
  createdAt: number;
}

export interface Note {
  id: string;
  bookId: string;
  page: number;
  /** The word/line/phrase the note is anchored to. */
  referenceText: string;
  /** The user's note body (markdown allowed). */
  body: string;
  /** Optional color of the underlying highlight, if any. */
  color?: HighlightColor;
  createdAt: number;
  updatedAt: number;
}

/** Dictionary API shape — a subset of dictionaryapi.dev's response. */
export interface DictionaryDefinition {
  partOfSpeech: string;
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

export interface DictionaryEntry {
  word: string;
  phonetic?: string;
  audioUrl?: string;
  meanings: DictionaryDefinition[];
  source?: string;
}

/** A user-friendly error shape used everywhere instead of raw exceptions. */
export interface AppError {
  code: string;
  message: string;
  cause?: unknown;
}
