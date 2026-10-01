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

export function resolveSellerOrigin(): string {
  const raw =
    process.env.VITE_SELLER_URL ||
    process.env.VITE_SELLER_APP_URL ||
    'http://localhost:5174'
  try {
    return new URL(raw).origin
  } catch {
    return 'http://localhost:5174'
  }
}

/** Public origin of product images (same as API S3_PUBLIC_BASE_URL). */
export function resolveCdnOrigin(): string | undefined {
  const raw =
    process.env.VITE_CDN_URL?.trim() ||
    process.env.S3_PUBLIC_BASE_URL?.trim()
  if (!raw) return undefined
  try {
    return new URL(raw).origin
  } catch {
    return undefined
  }
}

export function buildManifest(): Record<string, unknown> {
  const apiOrigin = resolveApiOrigin()
  const sellerOrigin = resolveSellerOrigin()
  const cdnOrigin = resolveCdnOrigin()

  const hostPermissions = [
    `${apiOrigin}/*`,
    'https://www.facebook.com/*',
    'https://web.facebook.com/*',
  ]
  if (cdnOrigin) {
    hostPermissions.push(`${cdnOrigin}/*`)
  }

  return {
    manifest_version: 3,
    name: 'Vendelo360 Facebook',
    description: 'Publica productos del broker en grupos de Facebook.',
    version: '0.1.0',
    icons: {
      '16': 'icons/icon16.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png',
    },
    action: {
      default_popup: 'popup.html',
      default_title: 'Vendelo360 Facebook',
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
    permissions: ['storage', 'tabs', 'scripting'],
    host_permissions: hostPermissions,
    content_scripts: [
      {
        matches: ['https://www.facebook.com/*', 'https://web.facebook.com/*'],
        js: ['content.js'],
        run_at: 'document_idle',
      },
    ],
    web_accessible_resources: [
      {
        resources: ['config/groups.json'],
        matches: [`${sellerOrigin}/*`, 'https://www.facebook.com/*'],
      },
    ],
  }
}

export { rootDir }
