import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const refMock = vi.fn();
const uploadBytesResumableMock = vi.fn();
const getDownloadURLMock = vi.fn();
const deleteObjectMock = vi.fn();

vi.mock('firebase/storage', () => ({
  ref: (...args: unknown[]) => refMock(...args),
  uploadBytesResumable: (...args: unknown[]) => uploadBytesResumableMock(...args),
  getDownloadURL: (...args: unknown[]) => getDownloadURLMock(...args),
  deleteObject: (...args: unknown[]) => deleteObjectMock(...args),
}));

vi.mock('@/services/firebase', () => ({
  getBucket: () => ({ name: 'bucket' }),
}));

interface UploadEvents {
  next?: (snap: { bytesTransferred: number; totalBytes: number; ref: unknown }) => void;
  error?: (err: unknown) => void;
  complete?: () => void;
}

let lastUploadEvents: UploadEvents = {};

beforeEach(async () => {
  refMock.mockReturnValue({ name: 'ref' });
  lastUploadEvents = {};
  uploadBytesResumableMock.mockImplementation(() => ({
    snapshot: { ref: { name: 'ref' } },
    cancel: vi.fn(),
    on: (
      _event: string,
      next: UploadEvents['next'],
      error: UploadEvents['error'],
      complete: UploadEvents['complete'],
    ) => {
      lastUploadEvents = { next, error, complete };
    },
  }));
  getDownloadURLMock.mockResolvedValue('https://example/file.pdf');
  deleteObjectMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

async function loadStorage() {
  return import('@/services/storage');
}

describe('storage service', () => {
  it('builds the canonical book storage path', async () => {
    const { bookStoragePath } = await loadStorage();
    expect(bookStoragePath('u1', 'b1')).toBe('users/u1/books/b1.pdf');
  });

  it('uploadBook resolves with the download URL on completion', async () => {
    const { uploadBook } = await loadStorage();
    const file = new File(['data'], 'book.pdf', { type: 'application/pdf' });
    const handle = uploadBook('u1', 'b1', file);
    lastUploadEvents.complete?.();
    const result = await handle.done;
    expect(result.downloadUrl).toBe('https://example/file.pdf');
    expect(result.storagePath).toBe('users/u1/books/b1.pdf');
  });

  it('uploadBook surfaces progress callbacks', async () => {
    const { uploadBook } = await loadStorage();
    const onProgress = vi.fn();
    const file = new File(['x'], 'b.pdf', { type: 'application/pdf' });
    uploadBook('u1', 'b1', file, onProgress);
    lastUploadEvents.next?.({ bytesTransferred: 50, totalBytes: 100, ref: {} });
    expect(onProgress).toHaveBeenCalledWith({ loaded: 50, total: 100, percent: 50 });
  });

  it('uploadBook ignores progress when totalBytes is 0', async () => {
    const { uploadBook } = await loadStorage();
    const onProgress = vi.fn();
    const file = new File(['x'], 'b.pdf', { type: 'application/pdf' });
    uploadBook('u1', 'b1', file, onProgress);
    lastUploadEvents.next?.({ bytesTransferred: 0, totalBytes: 0, ref: {} });
    expect(onProgress).not.toHaveBeenCalled();
  });

  it('uploadBook propagates upload errors', async () => {
    const { uploadBook } = await loadStorage();
    const file = new File(['x'], 'b.pdf', { type: 'application/pdf' });
    const handle = uploadBook('u1', 'b1', file);
    lastUploadEvents.error?.(new Error('network down'));
    await expect(handle.done).rejects.toThrow(/network down/);
  });

  it('uploadBook propagates a getDownloadURL failure', async () => {
    getDownloadURLMock.mockRejectedValueOnce(new Error('url failed'));
    const { uploadBook } = await loadStorage();
    const file = new File(['x'], 'b.pdf', { type: 'application/pdf' });
    const handle = uploadBook('u1', 'b1', file);
    lastUploadEvents.complete?.();
    await expect(handle.done).rejects.toThrow(/url failed/);
  });

  it('deleteBookFile is a noop for a missing object', async () => {
    deleteObjectMock.mockRejectedValueOnce({ code: 'storage/object-not-found' });
    const { deleteBookFile } = await loadStorage();
    await expect(deleteBookFile('users/u/books/b.pdf')).resolves.toBeUndefined();
  });

  it('deleteBookFile re-throws other Storage errors', async () => {
    deleteObjectMock.mockRejectedValueOnce({ code: 'storage/unauthorized' });
    const { deleteBookFile } = await loadStorage();
    await expect(deleteBookFile('users/u/books/b.pdf')).rejects.toBeTruthy();
  });

  it('refreshDownloadUrl returns a fresh URL', async () => {
    getDownloadURLMock.mockResolvedValueOnce('https://example/refreshed');
    const { refreshDownloadUrl } = await loadStorage();
    expect(await refreshDownloadUrl('users/u/books/b.pdf')).toBe('https://example/refreshed');
  });
});
