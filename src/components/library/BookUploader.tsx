import { useRef, useState } from 'react';
import { CloudUpload, Loader2 } from 'lucide-react';
import { uploadBook } from '@/services/storage';
import { createBook, newBookRef } from '@/services/repository/books';
import { useAuthStore } from '@/store/useAuthStore';
import { notify } from '@/services/notifier';
import { formatBytes } from '@/utils/format';
import { cn } from '@/utils/cn';

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB — must match Storage Rules.

interface BookUploaderProps {
  onUploaded?: (bookId: string) => void;
}

export default function BookUploader({ onUploaded }: BookUploaderProps) {
  const uid = useAuthStore((s) => s.user?.uid);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  /** Strip the .pdf extension and tidy underscores so the title is readable. */
  function deriveTitle(filename: string): string {
    return filename
      .replace(/\.pdf$/i, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async function startUpload(file: File) {
    if (!uid) {
      notify.error('Not signed in', 'Please sign in to upload books.');
      return;
    }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      notify.error('Unsupported file', 'Lumen only accepts PDF files.');
      return;
    }
    if (file.size > MAX_BYTES) {
      notify.error(
        'File too large',
        `Maximum size is ${formatBytes(MAX_BYTES)}. Yours is ${formatBytes(file.size)}.`,
      );
      return;
    }

    setBusy(true);
    setProgress(0);
    try {
      const ref = newBookRef(uid);
      const handle = uploadBook(uid, ref.id, file, (p) => setProgress(p.percent));
      const { downloadUrl, storagePath } = await handle.done;
      await createBook(uid, {
        id: ref.id,
        title: deriveTitle(file.name),
        filename: file.name,
        storagePath,
        downloadUrl,
        sizeBytes: file.size,
      });
      notify.success('Upload complete', `"${deriveTitle(file.name)}" is in your library.`);
      onUploaded?.(ref.id);
    } catch (err) {
      notify.error('Upload failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setBusy(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) void startUpload(file);
      }}
      className={cn(
        'card p-6 text-center cursor-pointer select-none',
        'border-2 border-dashed transition-colors',
        dragOver
          ? 'border-royal-500 bg-royal-50/50 dark:bg-royal-900/20'
          : 'border-ink-200 dark:border-ink-800 hover:border-royal-400',
      )}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      aria-label="Upload a PDF"
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void startUpload(file);
        }}
      />
      <div className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-royal-100 text-royal-700 dark:bg-royal-900/50 dark:text-royal-300 mb-3">
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5" />}
      </div>
      <p className="font-medium">
        {busy ? `Uploading… ${progress}%` : 'Drop a PDF, or click to choose'}
      </p>
      <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
        Max {formatBytes(MAX_BYTES)} per file
      </p>

      {busy && (
        <div className="mt-3 max-w-xs mx-auto h-1.5 rounded-full bg-ink-100 dark:bg-ink-800 overflow-hidden">
          <div
            className="h-full bg-royal-500 transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
