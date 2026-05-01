import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import type { HighlightColor, Note } from '@/types';
import { getDb } from '../firebase';
import { paths } from './paths';

interface PersistedNote {
  page: number;
  referenceText: string;
  body: string;
  color?: HighlightColor;
  createdAt: number | { toMillis(): number };
  updatedAt: number | { toMillis(): number };
  /**
   * Stored on every note so the global "all notes" view can filter to the
   * current user's documents via a {@link collectionGroup} query.
   */
  ownerUid: string;
  bookId: string;
}

function tsToMs(v: number | { toMillis(): number }): number {
  return typeof v === 'number' ? v : v.toMillis();
}

function toNote(id: string, raw: PersistedNote): Note {
  return {
    id,
    bookId: raw.bookId,
    page: raw.page,
    referenceText: raw.referenceText,
    body: raw.body,
    color: raw.color,
    createdAt: tsToMs(raw.createdAt),
    updatedAt: tsToMs(raw.updatedAt),
  };
}

export interface CreateNoteInput {
  page: number;
  referenceText: string;
  body: string;
  color?: HighlightColor;
}

export async function addNote(
  uid: string,
  bookId: string,
  input: CreateNoteInput,
): Promise<Note> {
  const id = `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = Date.now();
  const persisted: PersistedNote = {
    page: input.page,
    referenceText: input.referenceText,
    body: input.body,
    color: input.color,
    ownerUid: uid,
    bookId,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(getDb(), paths.note(uid, bookId, id)), {
    ...persisted,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return toNote(id, persisted);
}

export async function updateNoteBody(
  uid: string,
  bookId: string,
  id: string,
  body: string,
): Promise<void> {
  await updateDoc(doc(getDb(), paths.note(uid, bookId, id)), {
    body,
    updatedAt: serverTimestamp(),
  });
}

export async function removeNote(uid: string, bookId: string, id: string): Promise<void> {
  await deleteDoc(doc(getDb(), paths.note(uid, bookId, id)));
}

export async function listNotesForBook(uid: string, bookId: string): Promise<Note[]> {
  const q = query(collection(getDb(), paths.notes(uid, bookId)), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toNote(d.id, d.data() as PersistedNote));
}

export function subscribeToNotes(
  uid: string,
  bookId: string,
  cb: (notes: Note[]) => void,
): Unsubscribe {
  const q = query(collection(getDb(), paths.notes(uid, bookId)), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => toNote(d.id, d.data() as PersistedNote)));
  });
}

/**
 * Subscribe to *every* note belonging to the current user across all books.
 * Powers the standalone "Notes" page.
 *
 * Uses a collectionGroup query keyed off the denormalized `ownerUid` field
 * — Firestore can't restrict a group query to a path prefix, so this is the
 * idiomatic way to keep the query secure under our auth-only rules.
 */
export function subscribeToAllNotes(uid: string, cb: (notes: Note[]) => void): Unsubscribe {
  const q = query(
    collectionGroup(getDb(), 'notes'),
    where('ownerUid', '==', uid),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => toNote(d.id, d.data() as PersistedNote)));
  });
}

/** Pure helper: search notes by free text. Exported for testability. */
export function searchNotes(notes: Note[], searchTerm: string): Note[] {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return notes;
  return notes.filter(
    (n) =>
      n.body.toLowerCase().includes(term) ||
      n.referenceText.toLowerCase().includes(term),
  );
}
