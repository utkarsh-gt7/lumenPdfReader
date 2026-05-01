import { describe, expect, it, vi } from 'vitest';
import { lookup, parseEntry } from '@/services/dictionary';

const sampleResponse = [
  {
    word: 'serendipity',
    phonetic: '/ˌsɛrənˈdɪpɪti/',
    phonetics: [
      { text: '/ˌsɛrənˈdɪpɪti/', audio: 'https://example.com/serendipity.mp3' },
      { text: '', audio: '' },
    ],
    meanings: [
      {
        partOfSpeech: 'noun',
        definitions: [
          {
            definition: 'The occurrence of events by chance in a happy way.',
            example: 'A fortunate stroke of serendipity.',
            synonyms: ['fluke', 'happy chance'],
            antonyms: ['misfortune'],
          },
          { definition: 'Lucky discoveries.' },
        ],
      },
    ],
    sourceUrls: ['https://en.wiktionary.org/wiki/serendipity'],
  },
];

describe('parseEntry', () => {
  it('flattens definitions and surfaces audio', () => {
    const entry = parseEntry(sampleResponse, 'serendipity');
    expect(entry.word).toBe('serendipity');
    expect(entry.phonetic).toBe('/ˌsɛrənˈdɪpɪti/');
    expect(entry.audioUrl).toBe('https://example.com/serendipity.mp3');
    expect(entry.meanings).toHaveLength(2);
    expect(entry.meanings[0]).toMatchObject({
      partOfSpeech: 'noun',
      definition: 'The occurrence of events by chance in a happy way.',
      example: 'A fortunate stroke of serendipity.',
    });
    expect(entry.source).toContain('wiktionary');
  });

  it('falls back to the requested word when the API omits it', () => {
    const entry = parseEntry([{ word: '' } as never], 'fallback');
    expect(entry.word).toBe('fallback');
    expect(entry.meanings).toHaveLength(0);
  });

  it('uses the meaning-level synonyms when definition-level ones are absent', () => {
    const entry = parseEntry(
      [
        {
          word: 'x',
          meanings: [
            {
              partOfSpeech: 'noun',
              synonyms: ['shared'],
              definitions: [{ definition: 'd' }],
            },
          ],
        },
      ],
      'x',
    );
    expect(entry.meanings[0].synonyms).toEqual(['shared']);
  });
});

describe('lookup', () => {
  function mockOk(body: unknown) {
    return vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => body,
    } as Response);
  }

  it('rejects empty input early', async () => {
    const fetcher = vi.fn();
    await expect(lookup('   ', fetcher as unknown as typeof fetch)).rejects.toThrow(
      /Nothing selected/,
    );
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('rejects long phrases', async () => {
    const fetcher = vi.fn();
    await expect(
      lookup('one two three four five six', fetcher as unknown as typeof fetch),
    ).rejects.toThrow(/too long/);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('returns a parsed entry on a successful response', async () => {
    const fetcher = mockOk(sampleResponse);
    const entry = await lookup('serendipity', fetcher as unknown as typeof fetch);
    expect(entry.word).toBe('serendipity');
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining('/serendipity'));
  });

  it('throws a friendly message on 404', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    } as Response);
    await expect(lookup('xyzzyplugh', fetcher as unknown as typeof fetch)).rejects.toThrow(
      /No definition found/,
    );
  });

  it('throws on other HTTP failures', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);
    await expect(lookup('hello', fetcher as unknown as typeof fetch)).rejects.toThrow(/HTTP 500/);
  });

  it('throws when the response is empty', async () => {
    const fetcher = mockOk([]);
    await expect(lookup('hello', fetcher as unknown as typeof fetch)).rejects.toThrow(
      /No definition found/,
    );
  });

  it('URL-encodes the term', async () => {
    const fetcher = mockOk(sampleResponse);
    await lookup('café', fetcher as unknown as typeof fetch);
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining(encodeURIComponent('café')));
  });
});
