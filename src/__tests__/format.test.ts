import { describe, expect, it } from 'vitest';
import {
  clampZoom,
  formatBytes,
  formatRelativeTime,
  isSingleWord,
  normalizeSelectedText,
  readingProgressPercent,
} from '@/utils/format';

describe('formatBytes', () => {
  it('returns "0 B" for non-positive or invalid input', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-100)).toBe('0 B');
    expect(formatBytes(Number.NaN)).toBe('0 B');
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe('0 B');
  });

  it('formats bytes with whole-number precision', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('formats KB with 1 decimal', () => {
    expect(formatBytes(1500)).toBe('1.5 KB');
  });

  it('formats MB with 1 decimal', () => {
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
  });

  it('honors a custom decimals argument', () => {
    expect(formatBytes(1024 * 1024 + 512 * 1024, 2)).toBe('1.50 MB');
  });

  it('caps at TB for very large values', () => {
    const tenTB = 10 * 1024 ** 4;
    expect(formatBytes(tenTB)).toMatch(/TB$/);
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2025-06-15T12:00:00Z').getTime();

  it('returns "just now" within a minute', () => {
    expect(formatRelativeTime(now - 30_000, now)).toBe('just now');
  });

  it('formats minutes', () => {
    expect(formatRelativeTime(now - 5 * 60_000, now)).toBe('5m ago');
  });

  it('formats hours', () => {
    expect(formatRelativeTime(now - 3 * 3600_000, now)).toBe('3h ago');
  });

  it('returns "Yesterday" between 24 and 48 hours', () => {
    expect(formatRelativeTime(now - 30 * 3600_000, now)).toBe('Yesterday');
  });

  it('formats days within a week', () => {
    expect(formatRelativeTime(now - 4 * 86400_000, now)).toBe('4d ago');
  });

  it('falls back to a date string beyond a week', () => {
    const result = formatRelativeTime(now - 30 * 86400_000, now);
    expect(result).not.toMatch(/ago/);
    expect(result.length).toBeGreaterThan(0);
  });

  it('treats future timestamps as "just now"', () => {
    expect(formatRelativeTime(now + 1000, now)).toBe('just now');
  });
});

describe('readingProgressPercent', () => {
  it('returns 0 for invalid totals', () => {
    expect(readingProgressPercent(5, 0)).toBe(0);
    expect(readingProgressPercent(5, -10)).toBe(0);
    expect(readingProgressPercent(Number.NaN, 100)).toBe(0);
  });

  it('clamps the page to a sensible range', () => {
    expect(readingProgressPercent(0, 100)).toBe(1);
    expect(readingProgressPercent(150, 100)).toBe(100);
  });

  it('rounds to whole percents', () => {
    expect(readingProgressPercent(33, 100)).toBe(33);
    expect(readingProgressPercent(1, 3)).toBe(33);
  });
});

describe('clampZoom', () => {
  it('clamps within default bounds', () => {
    expect(clampZoom(0.1)).toBe(0.5);
    expect(clampZoom(10)).toBe(4);
    expect(clampZoom(1.5)).toBe(1.5);
  });

  it('honors custom bounds', () => {
    expect(clampZoom(2, 1, 1.8)).toBe(1.8);
  });

  it('returns 1 for non-finite input', () => {
    expect(clampZoom(Number.NaN)).toBe(1);
    expect(clampZoom(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe('normalizeSelectedText', () => {
  it('collapses whitespace', () => {
    expect(normalizeSelectedText('  hello\n\tworld  ')).toBe('hello world');
  });

  it('strips control chars', () => {
    expect(normalizeSelectedText('a\u0001b\u007fc')).toBe('abc');
  });

  it('returns an empty string for nothing meaningful', () => {
    expect(normalizeSelectedText('   \n\n   ')).toBe('');
  });
});

describe('isSingleWord', () => {
  it('accepts a plain word', () => {
    expect(isSingleWord('hello')).toBe(true);
  });

  it('accepts hyphenated and apostrophe words', () => {
    expect(isSingleWord("don't")).toBe(true);
    expect(isSingleWord('long-tail')).toBe(true);
  });

  it('accepts non-ASCII letters', () => {
    expect(isSingleWord('café')).toBe(true);
    expect(isSingleWord('東京')).toBe(true);
  });

  it('rejects multi-word selections', () => {
    expect(isSingleWord('hello world')).toBe(false);
  });

  it('rejects punctuation-only or empty input', () => {
    expect(isSingleWord('')).toBe(false);
    expect(isSingleWord('!!!')).toBe(false);
  });
});
