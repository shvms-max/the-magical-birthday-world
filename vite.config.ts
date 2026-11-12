import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/the-magical-birthday-world/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'The Magical Birthday World ?',
        short_name: 'Birthday Magic',
        description: 'A magical birthday surprise world for Mayra.',
        theme_color: '#f9a8d4',
        background_color: '#f5d9ff',
        display: 'standalone',
        start_url: '/the-magical-birthday-world/',
        icons: [
          {
            src: '/the-magical-birthday-world/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
});