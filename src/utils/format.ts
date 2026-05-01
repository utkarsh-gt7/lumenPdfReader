/**
 * Pretty-print a byte count: 1234567 → "1.2 MB".
 *
 * Uses base-1024 IEC units, capped at TB (anything bigger is unrealistic for
 * a single PDF and would fall back to TB anyway).
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i === 0 ? 0 : decimals)} ${units[i]}`;
}

/**
 * Format a unix-ms timestamp into a short, human-friendly relative string.
 * "just now" / "5m ago" / "2h ago" / "Yesterday" / "Mar 4".
 */
export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - timestamp);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 2 * day) return 'Yesterday';
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: now - timestamp > 365 * day ? 'numeric' : undefined,
  });
}

/**
 * Compute a reading-progress percentage 0..100. Pages are 1-indexed in the
 * UI; we treat reaching the last page as 100% complete.
 */
export function readingProgressPercent(currentPage: number, totalPages: number): number {
  if (!Number.isFinite(currentPage) || !Number.isFinite(totalPages) || totalPages <= 0) return 0;
  const clamped = Math.max(1, Math.min(currentPage, totalPages));
  return Math.round((clamped / totalPages) * 100);
}

/** Clamp a numeric zoom value to a safe rendering range. */
export function clampZoom(scale: number, min = 0.5, max = 4): number {
  if (!Number.isFinite(scale)) return 1;
  return Math.min(max, Math.max(min, scale));
}

/**
 * Normalize a piece of selected text — strip control chars and collapse
 * whitespace so it can be safely stored / passed to the dictionary API.
 *
 * The control-char strip is intentional sanitization (PDF text layers
 * occasionally contain U+007F) — `no-control-regex` is silenced here.
 */
export function normalizeSelectedText(input: string): string {
  // Collapse all whitespace (including tabs/newlines) into single spaces first;
  // then strip *non-whitespace* control characters that can sneak in from PDF
  // text layers (U+007F is the most common offender).
  const collapsed = input.replace(/\s+/g, ' ');
  // eslint-disable-next-line no-control-regex
  return collapsed.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim();
}

/**
 * Decide whether a selection looks like a single word (so we should offer
 * a dictionary lookup instead of just a generic note action).
 */
export function isSingleWord(text: string): boolean {
  const cleaned = normalizeSelectedText(text);
  if (!cleaned) return false;
  return /^[\p{L}'-]+$/u.test(cleaned);
}
