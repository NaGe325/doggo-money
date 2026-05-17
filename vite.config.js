import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// 部署到 GitHub Pages 时，仓库名当作 base 路径
// 例如仓库 https://github.com/NaGe325/- → https://nage325.github.io/-/
// 通过环境变量 BASE_PATH 控制：默认 '/' （本地/Vercel），CI 部署时设置成 '/-/'
const BASE = process.env.BASE_PATH || '/';

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: '工资进度条 · 小狗使者陪你打工',
        short_name: '工资进度条',
        description: '实时显示今天赚了多少钱，配可爱小狗安慰你',
        theme_color: '#ffd6c2',
        background_color: '#fff5e6',
        display: 'standalone',
        orientation: 'portrait',
        start_url: BASE,
        scope: BASE,
        lang: 'zh-CN',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  server: { port: 5173, host: true, open: true },
});
