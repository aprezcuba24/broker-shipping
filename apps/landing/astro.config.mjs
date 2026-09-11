// @ts-check
import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://vendeya.app',
  vite: {
    plugins: [tailwindcss()],
    server: {
      port: 5176,
      host: true,
    },
  },
  server: {
    port: 5176,
    host: true,
  },
})
