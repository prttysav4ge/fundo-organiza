import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_INLINE=1 incrusta las imágenes en el JS (vista previa de un solo archivo).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { assetsInlineLimit: process.env.VITE_INLINE ? 100_000_000 : 4096 },
})
