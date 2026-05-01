import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type UploadTaskSnapshot,
} from 'firebase/storage';
import { getBucket } from './firebase';

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface UploadHandle {
  /** Promise resolving with the public download URL once the upload completes. */
  done: Promise<{ downloadUrl: string; storagePath: string }>;
  /** Cancel an in-flight upload. */
  cancel: () => void;
}

/** Build the canonical Storage path for a user's book PDF. */
export function bookStoragePath(uid: string, bookId: string): string {
  return `users/${uid}/books/${bookId}.pdf`;
}

/**
 * Upload a PDF file to Firebase Storage with progress callbacks.
 *
 * The caller is expected to validate the file (mime + size) before invoking
 * this — Storage Rules also enforce both, but a client-side check provides
 * faster, friendlier feedback.
 */
export function uploadBook(
  uid: string,
  bookId: string,
  file: File,
  onProgress?: (p: UploadProgress) => void,
): UploadHandle {
  const path = bookStoragePath(uid, bookId);
  const storageRef = ref(getBucket(), path);
  const task = uploadBytesResumable(storageRef, file, {
    contentType: 'application/pdf',
  });

  const done = new Promise<{ downloadUrl: string; storagePath: string }>((resolve, reject) => {
    task.on(
      'state_changed',
      (snap: UploadTaskSnapshot) => {
        if (onProgress && snap.totalBytes > 0) {
          onProgress({
            loaded: snap.bytesTransferred,
            total: snap.totalBytes,
            percent: Math.round((snap.bytesTransferred / snap.totalBytes) * 100),
          });
        }
      },
      reject,
      async () => {
        try {
          const downloadUrl = await getDownloadURL(task.snapshot.ref);
          resolve({ downloadUrl, storagePath: path });
        } catch (err) {
          reject(err);
        }
      },
    );
  });

  return {
    done,
    cancel: () => task.cancel(),
  };
}

/** Delete a previously uploaded book. Idempotent — missing files are ignored. */
export async function deleteBookFile(storagePath: string): Promise<void> {
  try {
    await deleteObject(ref(getBucket(), storagePath));
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === 'storage/object-not-found') return;
    throw err;
  }
}

/** Refresh an expired download URL. */
export async function refreshDownloadUrl(storagePath: string): Promise<string> {
  return getDownloadURL(ref(getBucket(), storagePath));
}
