import path from 'node:path'
import { defineConfig } from 'vite'
import { rootDir } from './manifest.shared.ts'

/**
 * Seller bridge build (IIFE). Run after vite.extension.config.ts.
 * Does not empty dist/ so content.js, background.js, popup.html and icons are kept.
 */
export default defineConfig(() => {
  return {
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
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
        input: path.resolve(rootDir, 'src/seller-bridge.ts'),
        output: {
          format: 'iife',
          name: 'VendeloFacebookBridge',
          entryFileNames: 'seller-bridge.js',
          inlineDynamicImports: true,
        },
      },
    },
  }
})
