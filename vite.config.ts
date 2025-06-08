import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    // Generate service worker and manifest
    rollupOptions: {
      input: {
        main: './index.html',
        sw: './public/sw.js'
      }
    }
  },
  // PWA-specific configurations
  server: {
    host: true, // Allow external connections for testing on mobile
    port: 5173
  },
  // Ensure proper MIME types for PWA files
  assetsInclude: ['**/*.webmanifest']
})
