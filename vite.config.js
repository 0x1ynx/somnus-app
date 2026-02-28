import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-dragon-192.png', 'icon-dragon-512.png'],
      manifest: {
        name: 'Somnus · Dream Journal',
        short_name: 'Somnus',
        description: 'A gentle dream journal to capture the stories your sleeping mind tells.',
        theme_color: '#0a0a1a',
        background_color: '#0a0a1a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icon-dragon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-dragon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-dragon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
});
