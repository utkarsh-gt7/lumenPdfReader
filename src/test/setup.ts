import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// JSDOM doesn't implement matchMedia — components that use it (Tailwind dark
// mode, gesture queries) need a no-op stub.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// react-pdf relies on a worker; tests don't need real rendering.
vi.mock('react-pdf', () => {
  const Document = (props: { children?: unknown }) => props.children as never;
  const Page = () => null;
  return {
    Document,
    Page,
    pdfjs: { GlobalWorkerOptions: { workerSrc: '' }, version: 'test' },
  };
});

// Provide a noop ResizeObserver for components that observe layout changes.
class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
(globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
  ResizeObserverStub;

// IntersectionObserver stub (used by lazy-loaded page renderer).
class IntersectionObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = '';
  thresholds = [];
}
(globalThis as unknown as { IntersectionObserver: typeof IntersectionObserverStub }).IntersectionObserver =
  IntersectionObserverStub;
