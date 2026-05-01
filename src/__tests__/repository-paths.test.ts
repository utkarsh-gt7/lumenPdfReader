import { describe, expect, it } from 'vitest';
import { paths } from '@/services/repository/paths';

describe('Firestore path helpers', () => {
  const uid = 'u1';
  const bookId = 'b1';
  const id = 'x1';

  it('builds the user document path', () => {
    expect(paths.user(uid)).toBe('users/u1');
  });

  it('builds the books collection path', () => {
    expect(paths.books(uid)).toBe('users/u1/books');
  });

  it('builds the book document path', () => {
    expect(paths.book(uid, bookId)).toBe('users/u1/books/b1');
  });

  it('builds the bookmarks path', () => {
    expect(paths.bookmarks(uid, bookId)).toBe('users/u1/books/b1/bookmarks');
    expect(paths.bookmark(uid, bookId, id)).toBe('users/u1/books/b1/bookmarks/x1');
  });

  it('builds the highlights path', () => {
    expect(paths.highlights(uid, bookId)).toBe('users/u1/books/b1/highlights');
    expect(paths.highlight(uid, bookId, id)).toBe('users/u1/books/b1/highlights/x1');
  });

  it('builds the notes path', () => {
    expect(paths.notes(uid, bookId)).toBe('users/u1/books/b1/notes');
    expect(paths.note(uid, bookId, id)).toBe('users/u1/books/b1/notes/x1');
  });
});
