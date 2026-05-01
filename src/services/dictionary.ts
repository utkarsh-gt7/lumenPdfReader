import type { DictionaryEntry } from '@/types';
import { normalizeSelectedText } from '@/utils/format';

const DEFAULT_ENDPOINT = 'https://api.dictionaryapi.dev/api/v2/entries/en';

/** Resolve the dictionary endpoint, allowing tests / local mocking to override. */
function endpoint(): string {
  return import.meta.env.VITE_DICTIONARY_API_URL || DEFAULT_ENDPOINT;
}

/**
 * Look up a word or phrase using dictionaryapi.dev (free, no API key).
 *
 * Phrases longer than 5 words are rejected — the upstream API only handles
 * single-word entries reliably, and feeding it a paragraph would just return
 * a 404.
 */
export async function lookup(input: string, fetcher: typeof fetch = fetch): Promise<DictionaryEntry> {
  const term = normalizeSelectedText(input);
  if (!term) {
    throw new Error('Nothing selected to look up.');
  }
  const wordCount = term.split(' ').length;
  if (wordCount > 5) {
    throw new Error('Selection is too long. Pick a single word or short phrase.');
  }

  const res = await fetcher(`${endpoint()}/${encodeURIComponent(term)}`);
  if (res.status === 404) {
    throw new Error(`No definition found for "${term}".`);
  }
  if (!res.ok) {
    throw new Error(`Dictionary API failed (HTTP ${res.status}). Try again in a moment.`);
  }

  const json = (await res.json()) as RawApiResponse[];
  if (!Array.isArray(json) || json.length === 0) {
    throw new Error(`No definition found for "${term}".`);
  }
  return parseEntry(json, term);
}

interface RawApiResponse {
  word: string;
  phonetic?: string;
  phonetics?: { audio?: string; text?: string }[];
  meanings?: {
    partOfSpeech?: string;
    definitions?: { definition?: string; example?: string; synonyms?: string[]; antonyms?: string[] }[];
    synonyms?: string[];
    antonyms?: string[];
  }[];
  sourceUrls?: string[];
}

/** Map the upstream response shape to our internal {@link DictionaryEntry}. */
export function parseEntry(raw: RawApiResponse[], fallbackWord: string): DictionaryEntry {
  const first = raw[0];
  const audio = first.phonetics?.find((p) => p.audio && p.audio.length > 0)?.audio;
  const phonetic = first.phonetic ?? first.phonetics?.find((p) => p.text)?.text;

  const meanings = (first.meanings ?? []).flatMap((m) => {
    const pos = m.partOfSpeech ?? '';
    return (m.definitions ?? []).map((d) => ({
      partOfSpeech: pos,
      definition: d.definition ?? '',
      example: d.example,
      synonyms: d.synonyms?.length ? d.synonyms : m.synonyms,
      antonyms: d.antonyms?.length ? d.antonyms : m.antonyms,
    }));
  });

  return {
    word: first.word && first.word.length > 0 ? first.word : fallbackWord,
    phonetic,
    audioUrl: audio,
    meanings,
    source: first.sourceUrls?.[0],
  };
}
