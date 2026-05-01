# Firebase Security Rules

These rules **must** be applied in the Firebase console before the app can be used. They enforce that every read/write is scoped to the authenticated user's UID.

## Firestore Rules

Paste into _Firestore Database → Rules_:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Per-user document tree.
    // /users/{uid}                                — profile
    // /users/{uid}/books/{bookId}                 — book metadata + reading state
    // /users/{uid}/books/{bookId}/bookmarks/{id}
    // /users/{uid}/books/{bookId}/highlights/{id}
    // /users/{uid}/books/{bookId}/notes/{id}
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;

      match /{collection}/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }

      match /{collection}/{docId}/{subCollection}/{subDocId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```

## Storage Rules

Paste into _Storage → Rules_:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Books are stored at /users/{uid}/books/{bookId}.pdf
    match /users/{uid}/books/{bookId} {
      // Limit uploads to 50 MB and PDF mime type.
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if request.auth != null
                   && request.auth.uid == uid
                   && request.resource.size < 50 * 1024 * 1024
                   && request.resource.contentType.matches('application/pdf');
      allow delete: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

## Authentication

Enable the following providers in _Authentication → Sign-in method_:

- **Google** — One-tap sign-in.
- **Email/Password** — Standard credentials login.
