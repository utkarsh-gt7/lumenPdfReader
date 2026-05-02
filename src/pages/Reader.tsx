import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Document } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import '@/components/reader/pdf-worker';

import LoadingSplash from '@/components/LoadingSplash';
import ReaderToolbar from '@/components/reader/ReaderToolbar';
import PageNavigator from '@/components/reader/PageNavigator';
import ZoomControls from '@/components/reader/ZoomControls';
import PdfPage from '@/components/reader/PdfPage';
import SelectionPopover from '@/components/reader/SelectionPopover';
import BookmarksDrawer from '@/components/reader/BookmarksDrawer';
import HighlightsDrawer from '@/components/reader/HighlightsDrawer';
import NotesDrawer from '@/components/reader/NotesDrawer';
import DictionaryDrawer from '@/components/reader/DictionaryDrawer';
import OnboardingTour from '@/components/onboarding/OnboardingTour';

import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { useDeviceType } from '@/hooks/useDeviceType';
import { usePinchZoom } from '@/hooks/usePinchZoom';
import { useSwipe } from '@/hooks/useSwipe';
import { useTextSelection } from '@/hooks/useTextSelection';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useFocusMode } from '@/hooks/useFocusMode';
import { useBrightnessGesture } from '@/hooks/useBrightnessGesture';

import { updateSettings } from '@/services/repository/profile';
import {
  setTotalPages,
  subscribeToBook,
  updateReadingPosition,
} from '@/services/repository/books';
import {
  addBookmark,
  removeBookmark,
  subscribeToBookmarks,
} from '@/services/repository/bookmarks';
import {
  addHighlight,
  changeHighlightColor,
  highlightsForPage,
  removeHighlight,
  subscribeToHighlights,
} from '@/services/repository/highlights';
import {
  addNote,
  removeNote,
  subscribeToNotes,
  updateNoteBody,
} from '@/services/repository/notes';
import { markOnboardingShown } from '@/services/repository/profile';
import { notify } from '@/services/notifier';
import type { Book, Bookmark, Highlight, HighlightColor, Note } from '@/types';
import { isSingleWord } from '@/utils/format';

/** Ms to wait before pushing a page change to Firestore — debounces rapid swipes. */
const PAGE_SYNC_DEBOUNCE = 700;
/** Ms to wait before persisting a brightness gesture — handles drag flurries. */
const BRIGHTNESS_SYNC_DEBOUNCE = 600;

export default function Reader() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const uid = useAuthStore((s) => s.user?.uid);
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const device = useDeviceType();

  const zoom = useUIStore((s) => s.zoom);
  const setZoom = useUIStore((s) => s.setZoom);
  const bumpZoom = useUIStore((s) => s.bumpZoom);
  const resetZoom = useUIStore((s) => s.resetZoom);
  const drawer = useUIStore((s) => s.drawer);
  const openDrawer = useUIStore((s) => s.openDrawer);
  const closeDrawer = useUIStore((s) => s.closeDrawer);
  const lookupTerm = useUIStore((s) => s.lookupTerm);
  const setLookupTerm = useUIStore((s) => s.setLookupTerm);

  const [book, setBook] = useState<Book | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const [page, setPage] = useState(1);
  /** True while the local page state is "ahead" of what's in Firestore. */
  const localPageRef = useRef<number>(1);
  /** Width the PDF Page should render at — recalculated on resize. */
  const [renderWidth, setRenderWidth] = useState<number>(720);

  const containerRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<HTMLDivElement>(null);

  /** True if the user manually dismissed the tour this session. */
  const [tourDismissed, setTourDismissed] = useState(false);

  // ──────────── data subscriptions ────────────
  useEffect(() => {
    if (!uid || !bookId) return;
    const unsub = subscribeToBook(uid, bookId, (b) => {
      if (!b) {
        notify.error('Book not found', 'It may have been removed from another device.');
        navigate('/', { replace: true });
        return;
      }
      setBook(b);
      // Cross-device sync: only adopt the remote page if the user isn't
      // mid-session on this device. If our local page is the same we just
      // wrote, ignore. If it's different and the remote is newer, take it.
      setPage((current) => {
        if (current === localPageRef.current && current !== b.currentPage) {
          localPageRef.current = b.currentPage;
          return b.currentPage;
        }
        return current;
      });
    });
    return unsub;
  }, [uid, bookId, navigate]);

  useEffect(() => {
    if (!uid || !bookId) return;
    const u1 = subscribeToBookmarks(uid, bookId, setBookmarks);
    const u2 = subscribeToHighlights(uid, bookId, setHighlights);
    const u3 = subscribeToNotes(uid, bookId, setNotes);
    return () => {
      u1();
      u2();
      u3();
    };
  }, [uid, bookId]);

  /**
   * The tour is *derived* from the persisted profile + a session-only flag,
   * not stored independently. Once the user dismisses it, we optimistically
   * update the profile (so the derived value flips to false immediately)
   * and persist to Firestore.
   */
  const showOnboarding =
    !tourDismissed && !!profile && !!uid && !profile.onboardingShownFor.includes(device);

  const dismissOnboarding = useCallback(() => {
    setTourDismissed(true);
    if (!profile || !uid) return;
    if (profile.onboardingShownFor.includes(device)) return;
    const next = {
      ...profile,
      onboardingShownFor: [...profile.onboardingShownFor, device],
    };
    setProfile(next);
    void markOnboardingShown(uid, device);
  }, [profile, uid, device, setProfile]);

  // ──────────── responsive sizing ────────────
  useEffect(() => {
    const compute = () => {
      const padding = device === 'mobile' ? 16 : 48;
      const max = device === 'mobile' ? 720 : 960;
      setRenderWidth(Math.min(max, window.innerWidth - padding));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [device]);

  // ──────────── reading-experience hooks ────────────
  // Fullscreen API — null target means fullscreen the whole document so
  // the toolbar/footer come along for the ride. Toggle from the toolbar
  // button or the F shortcut below.
  const { isFullscreen, isSupported: fullscreenSupported, toggle: toggleFullscreen } =
    useFullscreen(null);

  // Focus mode — when on, suppresses non-error toasts (via ToastHost),
  // mutes media, and asks the browser for a screen wake lock.
  const focusMode = profile?.settings.focusMode ?? false;
  useFocusMode(focusMode);

  const toggleFocusMode = useCallback(() => {
    if (!uid || !profile) return;
    const next = !focusMode;
    setProfile({
      ...profile,
      settings: { ...profile.settings, focusMode: next },
    });
    void updateSettings(uid, { focusMode: next }).catch((err) => {
      console.warn('[Reader] persist focusMode failed:', err);
    });
  }, [uid, profile, focusMode, setProfile]);

  // Brightness — read the live value from the store; persist on a debounce
  // so a touch-drag doesn't blast Firestore with a write per frame.
  const brightnessTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleBrightness = useCallback(
    (next: number) => {
      if (!uid || !profile) return;
      // Optimistic local update so the overlay tracks the gesture in real time.
      setProfile({
        ...profile,
        settings: { ...profile.settings, brightness: next },
      });
      if (brightnessTimer.current) clearTimeout(brightnessTimer.current);
      brightnessTimer.current = setTimeout(() => {
        void updateSettings(uid, { brightness: next });
      }, BRIGHTNESS_SYNC_DEBOUNCE);
    },
    [uid, profile, setProfile],
  );
  useBrightnessGesture({
    read: () => useAuthStore.getState().profile?.settings.brightness ?? 1,
    write: handleBrightness,
  });
  useEffect(
    () => () => {
      if (brightnessTimer.current) clearTimeout(brightnessTimer.current);
    },
    [],
  );

  // ──────────── gestures & shortcuts ────────────
  usePinchZoom(containerRef, () => useUIStore.getState().zoom, setZoom);

  const goNext = useCallback(() => {
    setPage((p) => {
      const total = book?.totalPages ?? 0;
      const next = total > 0 ? Math.min(p + 1, total) : p + 1;
      localPageRef.current = next;
      return next;
    });
  }, [book?.totalPages]);

  const goPrev = useCallback(() => {
    setPage((p) => {
      const next = Math.max(1, p - 1);
      localPageRef.current = next;
      return next;
    });
  }, []);

  useSwipe(swipeRef, goNext, goPrev);

  useKeyboardShortcuts({
    ArrowLeft: goPrev,
    ArrowRight: goNext,
    Plus: () => bumpZoom(0.1),
    Minus: () => bumpZoom(-0.1),
    Zero: resetZoom,
    B: () => void toggleBookmarkOnCurrentPage(),
    F: () => void toggleFullscreen(),
    Z: () => toggleFocusMode(),
    Escape: () => closeDrawer(),
  });

  // ──────────── current-page sync (debounced) ────────────
  useEffect(() => {
    if (!uid || !bookId || !book) return;
    if (page === book.currentPage) return;
    const t = setTimeout(() => {
      void updateReadingPosition(uid, bookId, page, book.totalPages);
    }, PAGE_SYNC_DEBOUNCE);
    return () => clearTimeout(t);
  }, [page, book, uid, bookId]);

  const handlePdfLoadSuccess = useCallback(
    async ({ numPages }: { numPages: number }) => {
      if (!uid || !bookId || !book) return;
      if (book.totalPages !== numPages) {
        try {
          await setTotalPages(uid, bookId, numPages);
        } catch (err) {
          console.error('Failed to persist totalPages:', err);
        }
      }
      // Snap to the persisted reading position the very first time we render.
      if (book.currentPage && book.currentPage !== page) {
        setPage(book.currentPage);
        localPageRef.current = book.currentPage;
      }
    },
    [uid, bookId, book, page],
  );

  // ──────────── selection actions ────────────
  const { selection, clear: clearSelection } = useTextSelection();

  const handleHighlight = useCallback(
    async (color: HighlightColor) => {
      if (!uid || !bookId || !selection) return;
      try {
        for (const [pageNum, rects] of selection.rectsByPage) {
          await addHighlight(uid, bookId, {
            page: pageNum,
            text: selection.text,
            color,
            rects,
          });
        }
        notify.success('Highlighted', `Saved in ${color}.`);
      } catch (err) {
        notify.error('Highlight failed', err instanceof Error ? err.message : 'Try again.');
      } finally {
        clearSelection();
      }
    },
    [uid, bookId, selection, clearSelection],
  );

  const handleAddNote = useCallback(async () => {
    if (!uid || !bookId || !selection) return;
    const body = window.prompt(`Note on "${selection.text.slice(0, 40)}…"`, '');
    if (body === null) return;
    try {
      const firstPage = Array.from(selection.rectsByPage.keys())[0] ?? page;
      await addNote(uid, bookId, {
        page: firstPage,
        referenceText: selection.text,
        body,
      });
      notify.success('Note saved');
    } catch (err) {
      notify.error('Note failed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      clearSelection();
    }
  }, [uid, bookId, selection, page, clearSelection]);

  const handleLookup = useCallback(() => {
    if (!selection) return;
    setLookupTerm(selection.text);
    openDrawer('dictionary');
    clearSelection();
  }, [selection, setLookupTerm, openDrawer, clearSelection]);

  // ──────────── bookmarks ────────────
  const currentPageBookmark = useMemo(
    () => bookmarks.find((b) => b.page === page),
    [bookmarks, page],
  );

  const toggleBookmarkOnCurrentPage = useCallback(async () => {
    if (!uid || !bookId) return;
    try {
      if (currentPageBookmark) {
        await removeBookmark(uid, bookId, currentPageBookmark.id);
        notify.info('Bookmark removed');
      } else {
        await addBookmark(uid, bookId, { page });
        notify.success('Bookmarked', `Saved on page ${page}.`);
      }
    } catch (err) {
      notify.error('Bookmark failed', err instanceof Error ? err.message : 'Try again.');
    }
  }, [uid, bookId, currentPageBookmark, page]);

  if (!book) {
    return <LoadingSplash label="Opening book…" />;
  }

  const visibleHighlights = highlightsForPage(highlights, page);

  return (
    <div className="min-h-screen flex flex-col bg-ink-950 text-ink-50">
      <ReaderToolbar
        title={book.title}
        bookmarkCount={bookmarks.length}
        highlightCount={highlights.length}
        noteCount={notes.length}
        onBookmarkPage={() => void toggleBookmarkOnCurrentPage()}
        isCurrentPageBookmarked={Boolean(currentPageBookmark)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={() => void toggleFullscreen()}
        fullscreenSupported={fullscreenSupported}
        focusMode={focusMode}
        onToggleFocusMode={toggleFocusMode}
      />

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-auto py-6 px-4 select-text"
      >
        <div ref={swipeRef} className="mx-auto" style={{ width: 'fit-content' }}>
          <Document
            file={book.downloadUrl}
            onLoadSuccess={handlePdfLoadSuccess}
            loading={<LoadingSplash label="Fetching pages…" />}
            error={
              <div className="card p-6 text-ink-900 dark:text-ink-100 max-w-sm mx-auto">
                <p className="font-medium">Couldn't load this PDF.</p>
                <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">
                  The download URL may have expired. Try going back and reopening.
                </p>
              </div>
            }
          >
            <PdfPage
              pageNumber={page}
              width={renderWidth}
              scale={zoom}
              highlights={visibleHighlights}
              onChangeHighlightColor={(id, color) => {
                if (uid && bookId) {
                  void changeHighlightColor(uid, bookId, id, color);
                }
              }}
              onPageDoubleTap={() => void toggleBookmarkOnCurrentPage()}
            />
          </Document>
        </div>
      </div>

      <footer className="sticky bottom-0 z-20 flex justify-center gap-2 p-3 pointer-events-none">
        <div className="pointer-events-auto">
          <PageNavigator
            page={page}
            totalPages={book.totalPages}
            onPrev={goPrev}
            onNext={goNext}
            onJump={(p) => {
              setPage(p);
              localPageRef.current = p;
            }}
          />
        </div>
        <div className="pointer-events-auto">
          <ZoomControls
            zoom={zoom}
            onZoomIn={() => bumpZoom(0.1)}
            onZoomOut={() => bumpZoom(-0.1)}
            onReset={resetZoom}
          />
        </div>
      </footer>

      {selection && (
        <SelectionPopover
          x={selection.anchorX}
          y={selection.anchorY}
          canLookup={isSingleWord(selection.text) || selection.text.split(' ').length <= 5}
          onHighlight={(c) => void handleHighlight(c)}
          onNote={() => void handleAddNote()}
          onLookup={handleLookup}
          onClose={clearSelection}
        />
      )}

      <BookmarksDrawer
        open={drawer === 'bookmarks'}
        onClose={closeDrawer}
        bookmarks={bookmarks}
        onJump={(p) => {
          setPage(p);
          localPageRef.current = p;
        }}
        onRemove={(id) => {
          if (uid && bookId) void removeBookmark(uid, bookId, id);
        }}
      />
      <HighlightsDrawer
        open={drawer === 'highlights'}
        onClose={closeDrawer}
        highlights={highlights}
        onJump={(p) => {
          setPage(p);
          localPageRef.current = p;
        }}
        onRemove={(id) => {
          if (uid && bookId) void removeHighlight(uid, bookId, id);
        }}
        onChangeColor={(id, color) => {
          if (uid && bookId) void changeHighlightColor(uid, bookId, id, color);
        }}
      />
      <NotesDrawer
        open={drawer === 'notes'}
        onClose={closeDrawer}
        notes={notes}
        onJump={(p) => {
          setPage(p);
          localPageRef.current = p;
        }}
        onRemove={(id) => {
          if (uid && bookId) void removeNote(uid, bookId, id);
        }}
        onSave={(id, body) => {
          if (uid && bookId) void updateNoteBody(uid, bookId, id, body);
        }}
      />
      <DictionaryDrawer
        open={drawer === 'dictionary'}
        onClose={() => {
          closeDrawer();
          setLookupTerm(null);
        }}
        initialTerm={lookupTerm}
      />

      {showOnboarding && <OnboardingTour device={device} onClose={dismissOnboarding} />}
    </div>
  );
}
