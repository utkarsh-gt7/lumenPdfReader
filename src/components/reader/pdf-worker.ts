import { pdfjs } from 'react-pdf';

/**
 * pdfjs-dist needs a Web Worker to parse PDFs off the main thread.
 *
 * `import.meta.url` resolves to the URL of *this module* at runtime; Vite
 * follows the relative path and emits the worker as a hashed asset that
 * lives next to the JS bundle. This avoids hard-coded CDN URLs (which can
 * vary by version) and works identically in dev and production builds.
 */
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export const pdfWorkerVersion = pdfjs.version;
