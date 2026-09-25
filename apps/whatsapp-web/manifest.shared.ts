import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export function resolveApiOrigin(): string {
  const raw = process.env.VITE_API_URL || 'http://localhost:8000'
  try {
    return new URL(raw).origin
  } catch {
    return 'http://localhost:8000'
  }
}

export function buildManifest(): Record<string, unknown> {
  const apiOrigin = resolveApiOrigin()
  return {
    manifest_version: 3,
    name: 'Vendelo360',
    description: 'Ficha del cliente en WhatsApp Web.',
    version: '0.1.0',
    icons: {
      '16': 'icons/icon16.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png',
    },
    action: {
      default_popup: 'popup.html',
      default_title: 'Vendelo360',
      default_icon: {
        '16': 'icons/icon16.png',
        '48': 'icons/icon48.png',
        '128': 'icons/icon128.png',
      },
    },
    background: {
      service_worker: 'background.js',
      type: 'module',
    },
    permissions: ['storage'],
    host_permissions: [`${apiOrigin}/*`, 'https://web.whatsapp.com/*'],
    content_scripts: [
      {
        matches: ['https://web.whatsapp.com/*'],
        js: ['content.js'],
        run_at: 'document_idle',
      },
    ],
    web_accessible_resources: [
      {
        resources: ['fonts/*'],
        matches: ['https://web.whatsapp.com/*'],
      },
    ],
  }
}

export { rootDir }
