/**
 * Centralized Firestore path helpers. Keeping every collection name in one
 * place avoids "stringly-typed" typos sprinkled across the codebase and
 * makes a future schema rename a one-line change.
 */
export const paths = {
  user: (uid: string) => `users/${uid}`,
  books: (uid: string) => `users/${uid}/books`,
  book: (uid: string, bookId: string) => `users/${uid}/books/${bookId}`,
  bookmarks: (uid: string, bookId: string) => `users/${uid}/books/${bookId}/bookmarks`,
  bookmark: (uid: string, bookId: string, id: string) =>
    `users/${uid}/books/${bookId}/bookmarks/${id}`,
  highlights: (uid: string, bookId: string) => `users/${uid}/books/${bookId}/highlights`,
  highlight: (uid: string, bookId: string, id: string) =>
    `users/${uid}/books/${bookId}/highlights/${id}`,
  notes: (uid: string, bookId: string) => `users/${uid}/books/${bookId}/notes`,
  note: (uid: string, bookId: string, id: string) =>
    `users/${uid}/books/${bookId}/notes/${id}`,
} as const;
