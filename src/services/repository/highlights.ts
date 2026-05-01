import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import type { Highlight, HighlightColor, NormalizedRect } from '@/types';
import { getDb } from '../firebase';
import { paths } from './paths';

interface PersistedHighlight {
  page: number;
  text: string;
  color: HighlightColor;
  rects: NormalizedRect[];
  createdAt: number | { toMillis(): number };
}

function toHighlight(id: string, bookId: string, raw: PersistedHighlight): Highlight {
  const createdAt =
    typeof raw.createdAt === 'number' ? raw.createdAt : raw.createdAt.toMillis();
  return {
    id,
    bookId,
    page: raw.page,
    text: raw.text,
    color: raw.color,
    rects: raw.rects ?? [],
    createdAt,
  };
}

export interface CreateHighlightInput {
  page: number;
  text: string;
  color: HighlightColor;
  rects: NormalizedRect[];
}

export async function addHighlight(
  uid: string,
  bookId: string,
  input: CreateHighlightInput,
): Promise<Highlight> {
  const id = `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await setDoc(doc(getDb(), paths.highlight(uid, bookId, id)), {
    ...input,
    createdAt: serverTimestamp(),
  });
  return toHighlight(id, bookId, { ...input, createdAt: Date.now() });
}

export async function changeHighlightColor(
  uid: string,
  bookId: string,
  id: string,
  color: HighlightColor,
): Promise<void> {
  await updateDoc(doc(getDb(), paths.highlight(uid, bookId, id)), { color });
}

export async function removeHighlight(uid: string, bookId: string, id: string): Promise<void> {
  await deleteDoc(doc(getDb(), paths.highlight(uid, bookId, id)));
}

export async function listHighlights(uid: string, bookId: string): Promise<Highlight[]> {
  const q = query(collection(getDb(), paths.highlights(uid, bookId)), orderBy('page', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toHighlight(d.id, bookId, d.data() as PersistedHighlight));
}

export function subscribeToHighlights(
  uid: string,
  bookId: string,
  cb: (highlights: Highlight[]) => void,
): Unsubscribe {
  const q = query(collection(getDb(), paths.highlights(uid, bookId)), orderBy('page', 'asc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => toHighlight(d.id, bookId, d.data() as PersistedHighlight)));
  });
}

/** Filter helper exported separately so it can be unit-tested in isolation. */
export function highlightsForPage(highlights: Highlight[], page: number): Highlight[] {
  return highlights.filter((h) => h.page === page);
}
