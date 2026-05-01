import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─────────────────────────────────────────────────────────────
// Mock the firestore SDK with the smallest stub that lets the
// repository code observe its inputs and report deterministic outputs.
// ─────────────────────────────────────────────────────────────
const docMock = vi.fn();
const collectionMock = vi.fn();
const collectionGroupMock = vi.fn();
const queryMock = vi.fn();
const whereMock = vi.fn();
const orderByMock = vi.fn();
const setDocMock = vi.fn();
const updateDocMock = vi.fn();
const deleteDocMock = vi.fn();
const getDocMock = vi.fn();
const getDocsMock = vi.fn();
const onSnapshotMock = vi.fn();
const serverTimestampSentinel = { __sentinel: true };

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(...args),
  collection: (...args: unknown[]) => collectionMock(...args),
  collectionGroup: (...args: unknown[]) => collectionGroupMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  where: (...args: unknown[]) => whereMock(...args),
  orderBy: (...args: unknown[]) => orderByMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  deleteDoc: (...args: unknown[]) => deleteDocMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  serverTimestamp: () => serverTimestampSentinel,
}));

vi.mock('@/services/firebase', () => ({
  getDb: () => ({ name: 'db' }),
}));

beforeEach(() => {
  docMock.mockImplementation((_db, path: string) => ({
    id: path?.split('/').pop() ?? 'doc',
    path,
  }));
  collectionMock.mockImplementation((_db, path: string) => ({ path }));
  collectionGroupMock.mockImplementation((_db, name: string) => ({ name }));
  queryMock.mockImplementation((c: unknown) => c);
  whereMock.mockImplementation((field, op, value) => ({ where: { field, op, value } }));
  orderByMock.mockImplementation((field, dir) => ({ orderBy: { field, dir } }));
  setDocMock.mockResolvedValue(undefined);
  updateDocMock.mockResolvedValue(undefined);
  deleteDocMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────
// books.ts
// ─────────────────────────────────────────────────────────────
describe('books repository', () => {
  it('newBookRef creates a doc reference under the user library', async () => {
    docMock.mockReturnValue({ id: 'auto-id' });
    const { newBookRef } = await import('@/services/repository/books');
    const ref = newBookRef('u1');
    expect(collectionMock).toHaveBeenCalledWith(expect.anything(), 'users/u1/books');
    expect(ref.id).toBe('auto-id');
  });

  it('createBook persists the seed payload and returns the book', async () => {
    const { createBook } = await import('@/services/repository/books');
    const result = await createBook('u1', {
      id: 'b1',
      title: 'T',
      filename: 't.pdf',
      storagePath: 'users/u1/books/b1.pdf',
      downloadUrl: 'http://dl/b1',
      sizeBytes: 1234,
    });
    expect(setDocMock).toHaveBeenCalledTimes(1);
    expect(result.id).toBe('b1');
    expect(result.title).toBe('T');
    expect(result.totalPages).toBe(0);
    expect(result.currentPage).toBe(1);
  });

  it('setTotalPages updates only the totalPages field', async () => {
    const { setTotalPages } = await import('@/services/repository/books');
    await setTotalPages('u1', 'b1', 200);
    expect(updateDocMock).toHaveBeenCalledWith(expect.anything(), { totalPages: 200 });
  });

  it('updateReadingPosition clamps to total pages', async () => {
    const { updateReadingPosition } = await import('@/services/repository/books');
    await updateReadingPosition('u1', 'b1', 9999, 200);
    expect(updateDocMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ currentPage: 200, lastReadAt: serverTimestampSentinel }),
    );
  });

  it('updateReadingPosition snaps below-1 pages back to 1', async () => {
    const { updateReadingPosition } = await import('@/services/repository/books');
    await updateReadingPosition('u1', 'b1', -10, 200);
    expect(updateDocMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ currentPage: 1 }),
    );
  });

  it('updateReadingPosition tolerates an unknown total', async () => {
    const { updateReadingPosition } = await import('@/services/repository/books');
    await updateReadingPosition('u1', 'b1', 50);
    expect(updateDocMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ currentPage: 50 }),
    );
  });

  it('deleteBook calls deleteDoc on the right path', async () => {
    const { deleteBook } = await import('@/services/repository/books');
    await deleteBook('u1', 'b1');
    expect(deleteDocMock).toHaveBeenCalled();
  });

  it('listBooks maps Firestore docs to Book objects', async () => {
    getDocsMock.mockResolvedValue({
      docs: [
        {
          id: 'b1',
          data: () => ({
            title: 'T',
            filename: 't.pdf',
            storagePath: 'p',
            downloadUrl: 'd',
            totalPages: 5,
            currentPage: 2,
            lastReadAt: 100,
            addedAt: 50,
            sizeBytes: 1234,
          }),
        },
      ],
    });
    const { listBooks } = await import('@/services/repository/books');
    const books = await listBooks('u1');
    expect(books).toHaveLength(1);
    expect(books[0].title).toBe('T');
    expect(books[0].lastReadAt).toBe(100);
  });

  it('listBooks supports Firestore Timestamp objects', async () => {
    getDocsMock.mockResolvedValue({
      docs: [
        {
          id: 'b1',
          data: () => ({
            title: 'T',
            filename: 't.pdf',
            storagePath: 'p',
            downloadUrl: 'd',
            totalPages: 5,
            currentPage: 2,
            lastReadAt: { toMillis: () => 12345 },
            addedAt: { toMillis: () => 67890 },
            sizeBytes: 100,
          }),
        },
      ],
    });
    const { listBooks } = await import('@/services/repository/books');
    const [book] = await listBooks('u1');
    expect(book.lastReadAt).toBe(12345);
    expect(book.addedAt).toBe(67890);
  });

  it('subscribeToBooks invokes the callback with mapped books', async () => {
    onSnapshotMock.mockImplementation((_q, cb) => {
      (cb as (snap: unknown) => void)({
        docs: [
          {
            id: 'b1',
            data: () => ({
              title: 'T',
              filename: 't',
              storagePath: 'p',
              downloadUrl: 'd',
              totalPages: 1,
              currentPage: 1,
              lastReadAt: 0,
              addedAt: 0,
              sizeBytes: 0,
            }),
          },
        ],
      });
      return () => undefined;
    });
    const { subscribeToBooks } = await import('@/services/repository/books');
    const cb = vi.fn();
    subscribeToBooks('u1', cb);
    expect(cb).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'b1' })]));
  });

  it('subscribeToBook reports null when the document is missing', async () => {
    onSnapshotMock.mockImplementation((_ref, cb) => {
      (cb as (snap: unknown) => void)({ exists: () => false });
      return () => undefined;
    });
    const { subscribeToBook } = await import('@/services/repository/books');
    const cb = vi.fn();
    subscribeToBook('u1', 'b1', cb);
    expect(cb).toHaveBeenCalledWith(null);
  });
});

// ─────────────────────────────────────────────────────────────
// bookmarks.ts / highlights.ts / notes.ts (smaller surfaces)
// ─────────────────────────────────────────────────────────────
describe('bookmarks repository', () => {
  it('addBookmark writes a stable id pattern and returns the bookmark', async () => {
    const { addBookmark } = await import('@/services/repository/bookmarks');
    const bookmark = await addBookmark('u1', 'b1', { page: 7, label: 'chapter 1' });
    expect(setDocMock).toHaveBeenCalled();
    expect(bookmark.page).toBe(7);
    expect(bookmark.label).toBe('chapter 1');
    expect(bookmark.id).toMatch(/^p7_/);
  });

  it('removeBookmark deletes the bookmark doc', async () => {
    const { removeBookmark } = await import('@/services/repository/bookmarks');
    await removeBookmark('u1', 'b1', 'bk1');
    expect(deleteDocMock).toHaveBeenCalled();
  });

  it('listBookmarks returns mapped Bookmarks', async () => {
    getDocsMock.mockResolvedValue({
      docs: [{ id: 'k1', data: () => ({ page: 3, createdAt: 99 }) }],
    });
    const { listBookmarks } = await import('@/services/repository/bookmarks');
    const result = await listBookmarks('u1', 'b1');
    expect(result).toEqual([
      expect.objectContaining({ id: 'k1', page: 3, createdAt: 99, bookId: 'b1' }),
    ]);
  });

  it('subscribeToBookmarks pipes updates to the callback', async () => {
    onSnapshotMock.mockImplementation((_q, cb) => {
      (cb as (snap: unknown) => void)({
        docs: [{ id: 'k1', data: () => ({ page: 1, createdAt: 0 }) }],
      });
      return () => undefined;
    });
    const { subscribeToBookmarks } = await import('@/services/repository/bookmarks');
    const cb = vi.fn();
    subscribeToBookmarks('u1', 'b1', cb);
    expect(cb).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: 'k1' })]));
  });
});

describe('highlights repository', () => {
  it('addHighlight returns the highlight with a server timestamp shadow', async () => {
    const { addHighlight } = await import('@/services/repository/highlights');
    const h = await addHighlight('u1', 'b1', {
      page: 3,
      text: 'foo',
      color: 'yellow',
      rects: [{ x: 0, y: 0, width: 0.1, height: 0.05 }],
    });
    expect(h.color).toBe('yellow');
    expect(h.text).toBe('foo');
    expect(setDocMock).toHaveBeenCalled();
  });

  it('changeHighlightColor patches just the color field', async () => {
    const { changeHighlightColor } = await import('@/services/repository/highlights');
    await changeHighlightColor('u1', 'b1', 'h1', 'blue');
    expect(updateDocMock).toHaveBeenCalledWith(expect.anything(), { color: 'blue' });
  });

  it('removeHighlight deletes the doc', async () => {
    const { removeHighlight } = await import('@/services/repository/highlights');
    await removeHighlight('u1', 'b1', 'h1');
    expect(deleteDocMock).toHaveBeenCalled();
  });

  it('listHighlights maps results', async () => {
    getDocsMock.mockResolvedValue({
      docs: [
        {
          id: 'h1',
          data: () => ({
            page: 1,
            text: 'foo',
            color: 'pink',
            rects: [],
            createdAt: 0,
          }),
        },
      ],
    });
    const { listHighlights } = await import('@/services/repository/highlights');
    const out = await listHighlights('u1', 'b1');
    expect(out).toEqual([expect.objectContaining({ color: 'pink', bookId: 'b1' })]);
  });

  it('subscribeToHighlights wires onSnapshot to a callback', async () => {
    onSnapshotMock.mockImplementation((_q, cb) => {
      (cb as (snap: unknown) => void)({
        docs: [{ id: 'h1', data: () => ({ page: 1, text: 't', color: 'green', rects: [], createdAt: 0 }) }],
      });
      return () => undefined;
    });
    const { subscribeToHighlights } = await import('@/services/repository/highlights');
    const cb = vi.fn();
    subscribeToHighlights('u1', 'b1', cb);
    expect(cb).toHaveBeenCalled();
  });
});

describe('notes repository', () => {
  it('addNote denormalizes ownerUid and bookId for the global query', async () => {
    const { addNote } = await import('@/services/repository/notes');
    const note = await addNote('u1', 'b1', {
      page: 1,
      referenceText: 'r',
      body: 'b',
    });
    expect(setDocMock).toHaveBeenCalledTimes(1);
    const [, payload] = setDocMock.mock.calls[0];
    expect(payload).toMatchObject({ ownerUid: 'u1', bookId: 'b1' });
    expect(note.body).toBe('b');
  });

  it('updateNoteBody patches body with serverTimestamp', async () => {
    const { updateNoteBody } = await import('@/services/repository/notes');
    await updateNoteBody('u1', 'b1', 'n1', 'new body');
    expect(updateDocMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ body: 'new body', updatedAt: serverTimestampSentinel }),
    );
  });

  it('removeNote deletes the doc', async () => {
    const { removeNote } = await import('@/services/repository/notes');
    await removeNote('u1', 'b1', 'n1');
    expect(deleteDocMock).toHaveBeenCalled();
  });

  it('listNotesForBook maps results', async () => {
    getDocsMock.mockResolvedValue({
      docs: [
        {
          id: 'n1',
          data: () => ({
            page: 1,
            referenceText: 'r',
            body: 'b',
            ownerUid: 'u1',
            bookId: 'b1',
            createdAt: 1,
            updatedAt: 2,
          }),
        },
      ],
    });
    const { listNotesForBook } = await import('@/services/repository/notes');
    const result = await listNotesForBook('u1', 'b1');
    expect(result).toEqual([
      expect.objectContaining({ id: 'n1', body: 'b', referenceText: 'r' }),
    ]);
  });

  it('subscribeToAllNotes registers a collectionGroup query filtered by ownerUid', async () => {
    let registered = false;
    onSnapshotMock.mockImplementation((_q, cb) => {
      registered = true;
      (cb as (snap: unknown) => void)({ docs: [] });
      return () => undefined;
    });
    const { subscribeToAllNotes } = await import('@/services/repository/notes');
    subscribeToAllNotes('u1', vi.fn());
    expect(collectionGroupMock).toHaveBeenCalledWith(expect.anything(), 'notes');
    expect(whereMock).toHaveBeenCalledWith('ownerUid', '==', 'u1');
    expect(registered).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// profile.ts
// ─────────────────────────────────────────────────────────────
describe('profile repository', () => {
  it('getOrCreateProfile returns an existing profile', async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({
        email: 'a@b.c',
        displayName: 'A',
        photoURL: null,
        createdAt: 100,
        onboardingShownFor: ['mobile'],
        settings: { darkMode: false, fontScale: 1.1 },
      }),
    });
    const { getOrCreateProfile } = await import('@/services/repository/profile');
    const profile = await getOrCreateProfile({
      uid: 'u1',
      email: 'a@b.c',
      displayName: 'A',
      photoURL: null,
    });
    expect(profile.uid).toBe('u1');
    expect(profile.settings.darkMode).toBe(false);
    expect(profile.onboardingShownFor).toEqual(['mobile']);
  });

  it('getOrCreateProfile seeds a new profile when missing', async () => {
    getDocMock.mockResolvedValue({ exists: () => false, data: () => undefined });
    const { getOrCreateProfile } = await import('@/services/repository/profile');
    const profile = await getOrCreateProfile({
      uid: 'u1',
      email: null,
      displayName: null,
      photoURL: null,
    });
    expect(setDocMock).toHaveBeenCalled();
    expect(profile.settings).toEqual({ darkMode: true, fontScale: 1 });
    expect(profile.onboardingShownFor).toEqual([]);
  });

  it('handles a Firestore Timestamp createdAt', async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({
        email: null,
        displayName: null,
        photoURL: null,
        createdAt: { toMillis: () => 9999 },
        onboardingShownFor: [],
        settings: {},
      }),
    });
    const { getOrCreateProfile } = await import('@/services/repository/profile');
    const profile = await getOrCreateProfile({
      uid: 'u1',
      email: null,
      displayName: null,
      photoURL: null,
    });
    expect(profile.createdAt).toBe(9999);
  });

  it('markOnboardingShown is a no-op when already recorded', async () => {
    getDocMock.mockResolvedValue({
      data: () => ({ onboardingShownFor: ['desktop'] }),
    });
    const { markOnboardingShown } = await import('@/services/repository/profile');
    await markOnboardingShown('u1', 'desktop');
    expect(updateDocMock).not.toHaveBeenCalled();
  });

  it('markOnboardingShown appends the device class', async () => {
    getDocMock.mockResolvedValue({
      data: () => ({ onboardingShownFor: ['desktop'] }),
    });
    const { markOnboardingShown } = await import('@/services/repository/profile');
    await markOnboardingShown('u1', 'mobile');
    expect(updateDocMock).toHaveBeenCalledWith(expect.anything(), {
      onboardingShownFor: ['desktop', 'mobile'],
    });
  });

  it('updateSettings only patches provided keys', async () => {
    const { updateSettings } = await import('@/services/repository/profile');
    await updateSettings('u1', { darkMode: false });
    expect(updateDocMock).toHaveBeenCalledWith(expect.anything(), { 'settings.darkMode': false });
  });

  it('updateSettings is a no-op when called with no fields', async () => {
    const { updateSettings } = await import('@/services/repository/profile');
    await updateSettings('u1', {});
    expect(updateDocMock).not.toHaveBeenCalled();
  });
});
