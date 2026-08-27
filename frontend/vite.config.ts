import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// GitHub Pages project sites are served from /<repository-name>/.
export default defineConfig({
  base: '/horse-racing-analysis/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  preview: {
    port: 4173,
    host: true,
  },
})