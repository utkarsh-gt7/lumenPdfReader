import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import type { Book } from '@/types';
import { getDb } from '../firebase';
import { paths } from './paths';

interface PersistedBook {
  title: string;
  filename: string;
  storagePath: string;
  downloadUrl: string;
  totalPages: number;
  currentPage: number;
  lastReadAt: number | { toMillis(): number };
  addedAt: number | { toMillis(): number };
  sizeBytes: number;
}

function tsToMs(value: number | { toMillis(): number } | undefined): number {
  if (!value) return Date.now();
  return typeof value === 'number' ? value : value.toMillis();
}

function toBook(id: string, raw: PersistedBook): Book {
  return {
    id,
    title: raw.title,
    filename: raw.filename,
    storagePath: raw.storagePath,
    downloadUrl: raw.downloadUrl,
    totalPages: raw.totalPages ?? 0,
    currentPage: raw.currentPage ?? 1,
    lastReadAt: tsToMs(raw.lastReadAt),
    addedAt: tsToMs(raw.addedAt),
    sizeBytes: raw.sizeBytes ?? 0,
  };
}

/** Generate a new Firestore document ref so we can know the id before writing. */
export function newBookRef(uid: string) {
  return doc(collection(getDb(), paths.books(uid)));
}

export interface CreateBookInput {
  id: string;
  title: string;
  filename: string;
  storagePath: string;
  downloadUrl: string;
  sizeBytes: number;
}

/** Insert a freshly uploaded book into the user's library. */
export async function createBook(uid: string, input: CreateBookInput): Promise<Book> {
  const now = Date.now();
  const persisted: PersistedBook = {
    title: input.title,
    filename: input.filename,
    storagePath: input.storagePath,
    downloadUrl: input.downloadUrl,
    totalPages: 0,
    currentPage: 1,
    lastReadAt: now,
    addedAt: now,
    sizeBytes: input.sizeBytes,
  };
  await setDoc(doc(getDb(), paths.book(uid, input.id)), {
    ...persisted,
    addedAt: serverTimestamp(),
    lastReadAt: serverTimestamp(),
  });
  return toBook(input.id, persisted);
}

/** Update the persisted page count once the PDF has been parsed client-side. */
export async function setTotalPages(uid: string, bookId: string, totalPages: number): Promise<void> {
  await updateDoc(doc(getDb(), paths.book(uid, bookId)), { totalPages });
}

/**
 * Persist the user's current reading position for cross-device sync. Always
 * updates `lastReadAt` so the library list orders by most-recently-read.
 *
 * The page is clamped to [1, totalPages] (when known) to defend against bad
 * client state — e.g. an old device reporting a page beyond a re-uploaded
 * (shorter) PDF.
 */
export async function updateReadingPosition(
  uid: string,
  bookId: string,
  page: number,
  totalPages?: number,
): Promise<void> {
  const safePage = Math.max(1, totalPages ? Math.min(page, totalPages) : page);
  await updateDoc(doc(getDb(), paths.book(uid, bookId)), {
    currentPage: safePage,
    lastReadAt: serverTimestamp(),
  });
}

/** Permanently delete a book document. Storage cleanup is the caller's job. */
export async function deleteBook(uid: string, bookId: string): Promise<void> {
  await deleteDoc(doc(getDb(), paths.book(uid, bookId)));
}

/** Fetch all books once. Useful for SSR / one-shot rendering. */
export async function listBooks(uid: string): Promise<Book[]> {
  const q = query(collection(getDb(), paths.books(uid)), orderBy('lastReadAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toBook(d.id, d.data() as PersistedBook));
}

/** Subscribe to real-time updates for the entire library. */
export function subscribeToBooks(uid: string, cb: (books: Book[]) => void): Unsubscribe {
  const q = query(collection(getDb(), paths.books(uid)), orderBy('lastReadAt', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => toBook(d.id, d.data() as PersistedBook)));
  });
}

/** Subscribe to a single book — the reader uses this for cross-device page sync. */
export function subscribeToBook(
  uid: string,
  bookId: string,
  cb: (book: Book | null) => void,
): Unsubscribe {
  return onSnapshot(doc(getDb(), paths.book(uid, bookId)), (snap) => {
    cb(snap.exists() ? toBook(snap.id, snap.data() as PersistedBook) : null);
  });
}
