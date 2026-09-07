import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'icons/*.png'],
      manifest: {
        name: 'MultiMeteo - Previsioni Multi-Modello',
        short_name: 'MultiMeteo',
        description: 'Confronto multi-modello in tempo reale (ECMWF, ICON, GFS, Météo-France, UKMO, JMA, GEM, MeteoSwiss)',
        theme_color: '#090d16',
        background_color: '#090d16',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/v1\/forecast/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'open-meteo-forecast-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 6 // 6 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/geocoding-api\.open-meteo\.com\/v1\/search/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'open-meteo-geocoding-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
})
