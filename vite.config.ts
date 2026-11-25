import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves from /blokjes/. The URL is permanent: progress lives in localStorage for this origin.
export default defineConfig({
  base: '/blokjes/',
  build: { target: 'es2024' },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Blokjes',
        short_name: 'Blokjes',
        description: 'A few sums a day with blocks',
        display: 'standalone',
        background_color: '#F3F0FA',
        theme_color: '#F3F0FA',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,woff2,png,svg}'] },
    }),
  ],
})
