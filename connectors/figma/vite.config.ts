import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = dirname(fileURLToPath(import.meta.url));
const uiHtml = readFileSync(resolve(root, 'src/ui.html'), 'utf8');

export default defineConfig({
  root,
  define: {
    __html__: JSON.stringify(uiHtml),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    minify: true,
    lib: {
      entry: resolve(root, 'src/main.ts'),
      name: 'KggFigmaConnector',
      formats: ['iife'],
      fileName: () => 'main.js',
    },
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
});
