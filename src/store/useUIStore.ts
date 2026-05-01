import { create } from 'zustand';
import type { HighlightColor } from '@/types';
import { clampZoom } from '@/utils/format';

/**
 * Session-scoped UI state. Anything that survives a refresh lives in
 * Firestore (via the repository services); everything else lives here.
 */

export type ReaderDrawer = 'none' | 'bookmarks' | 'highlights' | 'notes' | 'dictionary';

interface UIState {
  /** Current page zoom factor, [0.5..4]. */
  zoom: number;
  setZoom: (zoom: number) => void;
  bumpZoom: (delta: number) => void;
  resetZoom: () => void;

  /** Currently active highlight color. */
  selectedColor: HighlightColor;
  setSelectedColor: (color: HighlightColor) => void;

  /** Which side panel (if any) is open in the reader. */
  drawer: ReaderDrawer;
  openDrawer: (d: ReaderDrawer) => void;
  closeDrawer: () => void;

  /** Last word/phrase looked up — surfaces in the dictionary drawer. */
  lookupTerm: string | null;
  setLookupTerm: (term: string | null) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  zoom: 1,
  setZoom: (zoom) => set({ zoom: clampZoom(zoom) }),
  bumpZoom: (delta) => set({ zoom: clampZoom(get().zoom + delta) }),
  resetZoom: () => set({ zoom: 1 }),

  selectedColor: 'yellow',
  setSelectedColor: (selectedColor) => set({ selectedColor }),

  drawer: 'none',
  openDrawer: (drawer) => set({ drawer }),
  closeDrawer: () => set({ drawer: 'none' }),

  lookupTerm: null,
  setLookupTerm: (lookupTerm) => set({ lookupTerm }),
}));
