import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { aeBridgePlugin } from './vite-plugin-ae-bridge'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), aeBridgePlugin()],
  optimizeDeps: {
    // @ffmpeg は ESM + WASM のため Vite の事前バンドルから除外
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
})
