/**
 * A fixed, full-viewport black overlay whose opacity is driven by the
 * `--brightness` CSS custom property (set in App.tsx from the user's
 * profile setting).
 *
 * The browser cannot actually dim a device's backlight from a web page —
 * that is a privileged OS-level capability. The visual effect of dimming
 * everything (UI + PDF content) is convincing enough to function as a
 * software brightness control, especially in low-light environments
 * where every brightness slider works this way regardless of host.
 *
 * Why a separate component:
 *  - `pointer-events: none` so it never intercepts clicks/scrolls.
 *  - High z-index so even modal drawers/dialogs are dimmed in concert.
 *  - Mounted at the app root, *not* per-page, so brightness is global
 *    instead of being scoped to one route.
 *  - Hidden from assistive tech via `aria-hidden`.
 */
export default function BrightnessOverlay() {
  return (
    <div
      data-testid="brightness-overlay"
      aria-hidden
      // The `brightness-overlay` class (defined in src/index.css) computes
      // opacity from the --brightness CSS var via calc(). Pulling it out of
      // an inline style means jsdom — which discards calc() values on
      // typed properties like opacity — still preserves the contract for
      // tests, and real browsers continue to honour the calc at paint time.
      className="fixed inset-0 z-[1000] pointer-events-none bg-black brightness-overlay"
    />
  );
}
