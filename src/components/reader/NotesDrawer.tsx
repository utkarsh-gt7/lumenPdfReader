import { useState } from 'react';
import { NotebookPen, Trash2, Save, Pencil } from 'lucide-react';
import Drawer from './Drawer';
import type { Note } from '@/types';
import { formatRelativeTime } from '@/utils/format';

interface NotesDrawerProps {
  open: boolean;
  onClose: () => void;
  notes: Note[];
  onJump: (page: number) => void;
  onRemove: (id: string) => void;
  onSave: (id: string, body: string) => void;
}

export default function NotesDrawer({
  open,
  onClose,
  notes,
  onJump,
  onRemove,
  onSave,
}: NotesDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} title="Notes" width="md">
      {notes.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="divide-y divide-ink-100 dark:divide-ink-800">
          {notes.map((n) => (
            <NoteRow
              key={n.id}
              note={n}
              onJump={() => {
                onJump(n.page);
                onClose();
              }}
              onRemove={() => onRemove(n.id)}
              onSave={(body) => onSave(n.id, body)}
            />
          ))}
        </ul>
      )}
    </Drawer>
  );
}

interface NoteRowProps {
  note: Note;
  onJump: () => void;
  onRemove: () => void;
  onSave: (body: string) => void;
}

function NoteRow({ note, onJump, onRemove, onSave }: NoteRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.body);

  return (
    <li className="p-3 space-y-2">
      <button type="button" onClick={onJump} className="block w-full text-left">
        <p className="text-xs text-ink-500 dark:text-ink-400 mb-1">
          Page {note.page} · {formatRelativeTime(note.createdAt)}
        </p>
        <p className="italic text-sm text-ink-700 dark:text-ink-300 line-clamp-2">
          “{note.referenceText}”
        </p>
      </button>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="input min-h-[6rem]"
            placeholder="Your thoughts…"
            autoFocus
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setDraft(note.body);
                setEditing(false);
              }}
              className="btn-ghost text-xs px-2 py-1"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(draft);
                setEditing(false);
              }}
              className="btn-primary text-xs px-2 py-1"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm whitespace-pre-wrap flex-1">{note.body}</p>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Edit note"
              className="p-1.5 rounded-md text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              aria-label="Remove note"
              className="p-1.5 rounded-md text-ink-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function EmptyState() {
  return (
    <div className="p-6 text-center text-sm text-ink-500 dark:text-ink-400">
      <NotebookPen className="w-8 h-8 mx-auto mb-2 opacity-40" />
      <p className="font-medium text-ink-700 dark:text-ink-200">No notes for this book</p>
      <p className="mt-1">
        Select text and tap the notebook icon to attach a thought to a specific line.
      </p>
    </div>
  );
}
