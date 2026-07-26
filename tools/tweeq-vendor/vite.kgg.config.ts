import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import glsl from 'vite-plugin-glsl'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  base: './',
  plugins: [
    glsl(),
    react(),
  ],
  publicDir: false,
  build: {
    sourcemap: true,
    lib: {
      name: 'Tweeq',
      entry: resolve(__dirname, 'src/kgg-entry.ts'),
      formats: ['es', 'cjs'],
      fileName: format => format === 'es' ? 'index.es.js' : 'index.cjs',
    },
    outDir: 'dist-kgg',
    rollupOptions: {
      // React remains application-owned. Every other runtime dependency is
      // bundled into the checked-in K-GG vendor artifact.
      external: ['react', 'react-dom', 'react/jsx-runtime'],
    },
  },
  define: {
    'process.env.PROMISE_QUEUE_COVERAGE': false,
  },
})
