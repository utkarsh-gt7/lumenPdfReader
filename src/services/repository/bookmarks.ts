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
  type Unsubscribe,
} from 'firebase/firestore';
import type { Bookmark } from '@/types';
import { getDb } from '../firebase';
import { paths } from './paths';

interface PersistedBookmark {
  page: number;
  label?: string;
  createdAt: number | { toMillis(): number };
}

function toBookmark(id: string, bookId: string, raw: PersistedBookmark): Bookmark {
  const createdAt =
    typeof raw.createdAt === 'number' ? raw.createdAt : raw.createdAt.toMillis();
  return {
    id,
    bookId,
    page: raw.page,
    label: raw.label,
    createdAt,
  };
}

export interface CreateBookmarkInput {
  page: number;
  label?: string;
}

/** Add a bookmark on a given page. Idempotent — same page + same label upserts. */
export async function addBookmark(
  uid: string,
  bookId: string,
  input: CreateBookmarkInput,
): Promise<Bookmark> {
  const id = `p${input.page}_${Date.now()}`;
  const persisted: PersistedBookmark = {
    page: input.page,
    label: input.label,
    createdAt: Date.now(),
  };
  await setDoc(doc(getDb(), paths.bookmark(uid, bookId, id)), {
    ...persisted,
    createdAt: serverTimestamp(),
  });
  return toBookmark(id, bookId, persisted);
}

export async function removeBookmark(uid: string, bookId: string, id: string): Promise<void> {
  await deleteDoc(doc(getDb(), paths.bookmark(uid, bookId, id)));
}

export async function listBookmarks(uid: string, bookId: string): Promise<Bookmark[]> {
  const q = query(collection(getDb(), paths.bookmarks(uid, bookId)), orderBy('page', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toBookmark(d.id, bookId, d.data() as PersistedBookmark));
}

export function subscribeToBookmarks(
  uid: string,
  bookId: string,
  cb: (bookmarks: Bookmark[]) => void,
): Unsubscribe {
  const q = query(collection(getDb(), paths.bookmarks(uid, bookId)), orderBy('page', 'asc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => toBookmark(d.id, bookId, d.data() as PersistedBookmark)));
  });
}
