import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  // Chrome content scripts have no Node `process`. Without this, React's
  // `process.env.NODE_ENV` checks throw and the extension does nothing.
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'public/manifest.json', dest: '.' },
        { src: 'public/icons', dest: '.' },
        { src: 'public/fonts', dest: '.' },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // App-style build (not lib): replaces env and tree-shakes React better.
    cssCodeSplit: false,
    modulePreload: false,
    target: 'es2022',
    minify: true,
    rollupOptions: {
      input: path.resolve(rootDir, 'src/content.ts'),
      output: {
        format: 'iife',
        name: 'VendeloWhatsAppWeb',
        entryFileNames: 'content.js',
        inlineDynamicImports: true,
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
})
