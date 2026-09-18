import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { aeBridgePlugin } from './vite-plugin-ae-bridge'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), aeBridgePlugin()],
  optimizeDeps: {
    // Tweeq is a checked-in file dependency symlinked into node_modules.
    // Include it explicitly so CI pre-bundles its large generated ESM entry
    // instead of transforming the vendor artifact for every browser request.
    include: ['tweeq'],
    // @ffmpeg は ESM + WASM のため Vite の事前バンドルから除外
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
})
