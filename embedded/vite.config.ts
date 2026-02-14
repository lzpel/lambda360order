import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import Pages from 'vite-plugin-pages';
import { resolve } from 'path';

// 環境変数でビルドモードを切り替え（デフォルトはアプリモード）
// BUILD_MODE=lib -> widget.js (ライブラリ)
// BUILD_MODE=app -> index.html (デモアプリ)
const isLib = process.env.BUILD_MODE === 'lib';

export default defineConfig({
  plugins: [
    react(),
    Pages({
      dirs: 'src/pages',
    }),
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  base: './', // GitHub Pagesでの相対パス対応
  build: isLib ? {
    // ライブラリビルド設定 (widget.js)
    lib: {
      entry: resolve(__dirname, 'src/widget-entry.tsx'),
      name: 'Lambda360Widget',
      formats: ['iife'],
      fileName: () => 'widget.js',
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
    cssCodeSplit: false,
    emptyOutDir: false, // distを消さない
  } : {
    // アプリビルド設定 (index.html)
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
    emptyOutDir: true,
  },
});
