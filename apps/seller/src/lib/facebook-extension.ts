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
 * Ask the Facebook extension to store the publish queue and open group tabs.
 * Falls back to `window.open` when the extension is missing or unreachable.
 */
export function startFacebookPublish(params: {
  adsMessages: FacebookPublishMessageSnapshot[]
  groups: FacebookPublishGroupPayload[]
}): Promise<StartPublishResult> {
  const { adsMessages, groups } = params
  if (adsMessages.length === 0) {
    return Promise.resolve({ ok: false, error: 'Selecciona al menos un anuncio.' })
  }
  if (groups.length === 0) {
    return Promise.resolve({ ok: false, error: 'Selecciona al menos un grupo.' })
  }

  const urls = groups.map((group) => group.url)
  const message: StartPublishMessage = {
    source: MESSAGE_SOURCE,
    type: 'START_PUBLISH',
    adsMessages,
    groups,
  }

  return new Promise((resolve) => {
    let timeout: ReturnType<typeof setTimeout> | null = null
    let resolved = false

    // Listener for the response from the extension
    const handleResponse = (event: MessageEvent) => {
      // Only accept messages from the same origin
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

      // Clear timeout and remove listener
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      window.removeEventListener('message', handleResponse)

      // Avoid resolving twice
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

    // Set up listener
    window.addEventListener('message', handleResponse)

    // Send message to the extension via postMessage
    window.postMessage(message, window.location.origin)

    // Timeout: if no response in ~500ms, assume extension is not installed or not reloaded
    timeout = setTimeout(() => {
      window.removeEventListener('message', handleResponse)
      if (resolved) return
      resolved = true

      // Fallback: open tabs manually and warn user
      openGroupTabs(urls)
      resolve({ ok: true, via: 'window', warned: true })
    }, RESPONSE_TIMEOUT_MS)
  })
}
