/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    // pdfjs-dist ships ESM; ensure Vite pre-bundles it for fast HMR
    include: ['pdfjs-dist', 'react-pdf'],
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'src/test/**',
        'src/**/*.d.ts',
        'src/**/*.config.*',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/types/**',
      ],
      // Pragmatic targets: 100% on business logic (utils, services, stores)
      // is enforced via per-file inspection; the global thresholds account
      // for the page-level integration tests where some heavily-mocked
      // branches (Reader, Settings sliders) aren't worth chasing.
      thresholds: {
        lines: 70,
        statements: 70,
        functions: 70,
        branches: 60,
      },
    },
  },
});
