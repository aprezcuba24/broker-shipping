import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import { rootDir } from './manifest.shared.ts'

/**
 * Service worker + popup build. Run after the content script build.
 * Does not empty dist/ so content.js, icons, and fonts are kept.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(rootDir, '../..'), '')
  const apiUrl = env.VITE_API_URL || process.env.VITE_API_URL || 'http://localhost:8000'
  const sellerUrl =
    env.VITE_SELLER_URL ||
    env.VITE_SELLER_APP_URL ||
    process.env.VITE_SELLER_URL ||
    'http://localhost:5174'

  return {
    base: './',
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
      'import.meta.env.VITE_SELLER_URL': JSON.stringify(sellerUrl),
    },
    plugins: [react()],
    publicDir: false,
    resolve: {
      alias: {
        '@': path.resolve(rootDir, './src'),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      cssCodeSplit: false,
      modulePreload: false,
      target: 'es2022',
      minify: true,
      rollupOptions: {
        input: {
          background: path.resolve(rootDir, 'src/background/index.ts'),
          popup: path.resolve(rootDir, 'popup.html'),
        },
        output: {
          entryFileNames: (chunk) =>
            chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },
  }
})
