import { beforeEach, describe, expect, it } from 'vitest';
import { useUIStore } from '@/store/useUIStore';

beforeEach(() => {
  useUIStore.setState({
    zoom: 1,
    selectedColor: 'yellow',
    drawer: 'none',
    lookupTerm: null,
  });
});

describe('useUIStore', () => {
  it('exposes sane defaults', () => {
    const s = useUIStore.getState();
    expect(s.zoom).toBe(1);
    expect(s.selectedColor).toBe('yellow');
    expect(s.drawer).toBe('none');
    expect(s.lookupTerm).toBeNull();
  });

  describe('zoom', () => {
    it('clamps setZoom into the safe range', () => {
      useUIStore.getState().setZoom(10);
      expect(useUIStore.getState().zoom).toBe(4);
      useUIStore.getState().setZoom(0.1);
      expect(useUIStore.getState().zoom).toBe(0.5);
    });

    it('bumpZoom adds clamped deltas', () => {
      useUIStore.getState().bumpZoom(0.3);
      expect(useUIStore.getState().zoom).toBeCloseTo(1.3);
      useUIStore.getState().bumpZoom(10);
      expect(useUIStore.getState().zoom).toBe(4);
      useUIStore.getState().bumpZoom(-100);
      expect(useUIStore.getState().zoom).toBe(0.5);
    });

    it('resetZoom returns to 1', () => {
      useUIStore.getState().setZoom(2.5);
      useUIStore.getState().resetZoom();
      expect(useUIStore.getState().zoom).toBe(1);
    });
  });

  describe('color', () => {
    it('updates the selected highlight color', () => {
      useUIStore.getState().setSelectedColor('green');
      expect(useUIStore.getState().selectedColor).toBe('green');
    });
  });

  describe('drawer', () => {
    it('opens and closes drawers', () => {
      useUIStore.getState().openDrawer('bookmarks');
      expect(useUIStore.getState().drawer).toBe('bookmarks');
      useUIStore.getState().closeDrawer();
      expect(useUIStore.getState().drawer).toBe('none');
    });

    it('replaces an open drawer with another', () => {
      useUIStore.getState().openDrawer('notes');
      useUIStore.getState().openDrawer('dictionary');
      expect(useUIStore.getState().drawer).toBe('dictionary');
    });
  });

  describe('lookupTerm', () => {
    it('round-trips a non-null term', () => {
      useUIStore.getState().setLookupTerm('serendipity');
      expect(useUIStore.getState().lookupTerm).toBe('serendipity');
    });

    it('can be cleared back to null', () => {
      useUIStore.getState().setLookupTerm('x');
      useUIStore.getState().setLookupTerm(null);
      expect(useUIStore.getState().lookupTerm).toBeNull();
    });
  });
});
