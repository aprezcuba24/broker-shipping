import type { FacebookPublishMessageSnapshot } from '../stores/facebook-publish-store'

export type FacebookPublishGroupPayload = {
  id: string
  name: string
  url: string
}

export type StartPublishMessage = {
  source: string
  type: 'START_PUBLISH'
  adsMessages: FacebookPublishMessageSnapshot[]
  groups: FacebookPublishGroupPayload[]
  openTabs: boolean
}

export type StartPublishResult =
  | { ok: true; via: 'extension' }
  | { ok: true; via: 'window'; warned: true }
  | { ok: false; error: string }

const MESSAGE_SOURCE = 'vendelo360-facebook'
const RESPONSE_TIMEOUT_MS = 500

function openGroupTabs(urls: string[]): void {
  for (const url of urls) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

/**
 * Ask the extension to store the publish queue.
 * When `openTabs` is true, also open Facebook group tabs (extension or window.open fallback).
 * When `openTabs` is false, the extension is required — no tab fallback.
 */
export function startFacebookPublish(params: {
  adsMessages: FacebookPublishMessageSnapshot[]
  groups: FacebookPublishGroupPayload[]
  openTabs: boolean
}): Promise<StartPublishResult> {
  const { adsMessages, groups, openTabs } = params
  if (adsMessages.length === 0) {
    return Promise.resolve({ ok: false, error: 'Selecciona al menos un anuncio.' })
  }
  if (openTabs && groups.length === 0) {
    return Promise.resolve({ ok: false, error: 'Selecciona al menos un grupo.' })
  }

  const urls = groups.map((group) => group.url)
  const message: StartPublishMessage = {
    source: MESSAGE_SOURCE,
    type: 'START_PUBLISH',
    adsMessages,
    groups,
    openTabs,
  }

  return new Promise((resolve) => {
    let timeout: ReturnType<typeof setTimeout> | null = null
    let resolved = false

    const handleResponse = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return
      }

      const response = event.data
      if (
        !response ||
        typeof response !== 'object' ||
        response.source !== MESSAGE_SOURCE ||
        response.type !== 'START_PUBLISH_RESPONSE'
      ) {
        return
      }

      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      window.removeEventListener('message', handleResponse)

      if (resolved) return
      resolved = true

      if (response.ok) {
        resolve({ ok: true, via: 'extension' })
      } else {
        const error =
          typeof response.error === 'string'
            ? response.error
            : 'La extensión no pudo iniciar la publicación.'
        resolve({ ok: false, error })
      }
    }

    window.addEventListener('message', handleResponse)
    window.postMessage(message, window.location.origin)

    timeout = setTimeout(() => {
      window.removeEventListener('message', handleResponse)
      if (resolved) return
      resolved = true

      if (openTabs) {
        openGroupTabs(urls)
        resolve({ ok: true, via: 'window', warned: true })
        return
      }

      resolve({
        ok: false,
        error:
          'La extensión no respondió. Verifica que esté instalada y recargada.',
      })
    }, RESPONSE_TIMEOUT_MS)
  })
}
