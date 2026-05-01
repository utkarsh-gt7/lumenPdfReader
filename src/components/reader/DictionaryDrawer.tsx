import { useEffect, useState } from 'react';
import { BookA, Volume2, Loader2 } from 'lucide-react';
import Drawer from './Drawer';
import type { DictionaryEntry } from '@/types';
import { lookup } from '@/services/dictionary';

interface DictionaryDrawerProps {
  open: boolean;
  onClose: () => void;
  /** When non-null, auto-fills the search box and triggers a lookup. */
  initialTerm: string | null;
}

export default function DictionaryDrawer({ open, onClose, initialTerm }: DictionaryDrawerProps) {
  const [term, setTerm] = useState('');
  const [entry, setEntry] = useState<DictionaryEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Mirror an incoming `initialTerm` prop into local input state. Done as
   * derived-state-during-render (the "previous prop" pattern) — *not* in
   * an effect — to avoid a cascading render. The async lookup itself fires
   * from the effect below once we've adopted the new term.
   */
  const [adoptedTerm, setAdoptedTerm] = useState<string | null>(null);
  if (open && initialTerm && initialTerm !== adoptedTerm) {
    setAdoptedTerm(initialTerm);
    setTerm(initialTerm);
  }

  useEffect(() => {
    if (adoptedTerm) {
      void search(adoptedTerm);
    }
  }, [adoptedTerm]);

  async function search(input: string) {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await lookup(input);
      setEntry(result);
    } catch (err) {
      setEntry(null);
      setError(err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Drawer open={open} onClose={onClose} title="Dictionary" width="md">
      <div className="p-3 border-b border-ink-100 dark:border-ink-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void search(term);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Look up a word…"
            className="input flex-1"
            autoComplete="off"
          />
          <button type="submit" disabled={loading} className="btn-primary text-sm px-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Define'}
          </button>
        </form>
      </div>

      <div className="p-3">
        {error && (
          <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/30 rounded p-3">
            {error}
          </div>
        )}
        {!error && !entry && !loading && (
          <div className="text-center text-sm text-ink-500 dark:text-ink-400 py-8">
            <BookA className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="font-medium text-ink-700 dark:text-ink-200">
              Look up any word without leaving the page
            </p>
            <p className="mt-1">
              Select a word in your book and tap the dictionary icon, or type one above.
            </p>
          </div>
        )}
        {entry && <EntryView entry={entry} />}
      </div>
    </Drawer>
  );
}

function EntryView({ entry }: { entry: DictionaryEntry }) {
  return (
    <article className="space-y-4">
      <header className="flex items-baseline gap-3 flex-wrap">
        <h3 className="font-display text-2xl">{entry.word}</h3>
        {entry.phonetic && (
          <span className="font-mono text-sm text-ink-500 dark:text-ink-400">{entry.phonetic}</span>
        )}
        {entry.audioUrl && (
          <button
            type="button"
            aria-label="Play pronunciation"
            onClick={() => {
              const audio = new Audio(entry.audioUrl);
              void audio.play();
            }}
            className="btn-ghost p-1.5"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        )}
      </header>

      <ol className="space-y-3 list-none">
        {entry.meanings.map((m, i) => (
          <li key={i}>
            <p className="text-xs uppercase tracking-wider text-royal-600 dark:text-royal-300 italic mb-1">
              {m.partOfSpeech}
            </p>
            <p className="text-sm">{m.definition}</p>
            {m.example && (
              <p className="text-xs italic text-ink-500 dark:text-ink-400 mt-1 pl-3 border-l-2 border-ink-200 dark:border-ink-700">
                “{m.example}”
              </p>
            )}
            {m.synonyms && m.synonyms.length > 0 && (
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
                <span className="font-medium">Synonyms: </span>
                {m.synonyms.slice(0, 6).join(', ')}
              </p>
            )}
          </li>
        ))}
      </ol>

      {entry.source && (
        <p className="text-xs text-ink-400">
          Source:{' '}
          <a
            href={entry.source}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-ink-600 dark:hover:text-ink-200"
          >
            {entry.source}
          </a>
        </p>
      )}
    </article>
  );
}
