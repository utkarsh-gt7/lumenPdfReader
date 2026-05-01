import { describe, expect, it } from 'vitest';
import { cn } from '@/utils/cn';

describe('cn', () => {
  it('joins string class names', () => {
    expect(cn('p-2', 'text-sm')).toBe('p-2 text-sm');
  });

  it('drops falsy entries', () => {
    const flag = false as boolean;
    expect(cn('p-2', flag && 'hidden', null, undefined, '')).toBe('p-2');
  });

  it('honors object syntax', () => {
    expect(cn('btn', { 'btn-primary': true, 'btn-disabled': false })).toBe('btn btn-primary');
  });

  it('de-duplicates conflicting Tailwind utilities (right-most wins)', () => {
    expect(cn('px-2 py-2', 'px-4')).toBe('py-2 px-4');
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });
});
