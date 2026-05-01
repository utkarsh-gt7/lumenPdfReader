import { describe, expect, it } from 'vitest';
import { highlightsForPage } from '@/services/repository/highlights';
import { searchNotes } from '@/services/repository/notes';
import type { Highlight, Note } from '@/types';

const baseHighlight: Omit<Highlight, 'id' | 'page'> = {
  bookId: 'b1',
  text: 'sample',
  color: 'yellow',
  rects: [],
  createdAt: 0,
};

describe('highlightsForPage', () => {
  const items: Highlight[] = [
    { ...baseHighlight, id: '1', page: 1 },
    { ...baseHighlight, id: '2', page: 2 },
    { ...baseHighlight, id: '3', page: 2 },
    { ...baseHighlight, id: '4', page: 3 },
  ];

  it('returns only highlights on the requested page', () => {
    expect(highlightsForPage(items, 2).map((h) => h.id)).toEqual(['2', '3']);
  });

  it('returns an empty array for missing pages', () => {
    expect(highlightsForPage(items, 99)).toEqual([]);
  });

  it('does not mutate the input array', () => {
    const before = items.map((h) => h.id);
    highlightsForPage(items, 1);
    expect(items.map((h) => h.id)).toEqual(before);
  });
});

const baseNote: Omit<Note, 'id' | 'page' | 'body' | 'referenceText'> = {
  bookId: 'b1',
  createdAt: 0,
  updatedAt: 0,
};

describe('searchNotes', () => {
  const items: Note[] = [
    {
      ...baseNote,
      id: 'n1',
      page: 1,
      referenceText: 'The mind is not a vessel',
      body: 'Plutarch quote about education.',
    },
    {
      ...baseNote,
      id: 'n2',
      page: 5,
      referenceText: 'Stoicism',
      body: 'Note about Marcus Aurelius.',
    },
  ];

  it('returns everything for an empty query', () => {
    expect(searchNotes(items, '')).toHaveLength(2);
    expect(searchNotes(items, '   ')).toHaveLength(2);
  });

  it('matches against the body, case-insensitively', () => {
    expect(searchNotes(items, 'plutarch')).toHaveLength(1);
    expect(searchNotes(items, 'MARCUS')).toHaveLength(1);
  });

  it('matches against the reference text', () => {
    expect(searchNotes(items, 'vessel')).toHaveLength(1);
  });

  it('returns an empty array on no match', () => {
    expect(searchNotes(items, 'nothing-here')).toEqual([]);
  });
});
