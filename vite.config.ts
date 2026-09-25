import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { aeBridgePlugin } from './vite-plugin-ae-bridge'
import { readFileSync } from 'node:fs'

// package.json is kept in sync with tauri.conf.json by `npm run release:check`.
const appVersion: string = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    aeBridgePlugin(),
    {
      // The pre-JavaScript splash in index.html shows the version before the bundle loads.
      name: 'kgg-app-version-html',
      transformIndexHtml: html => html.replaceAll('%KGG_APP_VERSION%', appVersion),
    },
  ],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  optimizeDeps: {
    // Tweeq is a checked-in file dependency symlinked into node_modules.
    // Include it explicitly so CI pre-bundles its large generated ESM entry
    // instead of transforming the vendor artifact for every browser request.
    include: ['tweeq'],
    // @ffmpeg は ESM + WASM のため Vite の事前バンドルから除外
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
})
