import type { FacebookPublishMessageSnapshot } from '../stores/facebook-publish-store'

export type FacebookPublishGroupPayload = {
  id: string
  name: string
  url: string
}

export type StartPublishMessage = {
  type: 'START_PUBLISH'
  adsMessages: FacebookPublishMessageSnapshot[]
  groups: FacebookPublishGroupPayload[]
}

export type StartPublishResult =
  | { ok: true; via: 'extension' }
  | { ok: true; via: 'window'; warned: true }
  | { ok: false; error: string }

const EXTENSION_ID = import.meta.env.VITE_FACEBOOK_EXTENSION_ID?.trim() || ''

type ChromeRuntime = {
  sendMessage: (
    extensionId: string,
    message: unknown,
    responseCallback?: (response: unknown) => void,
  ) => void
  lastError?: { message?: string }
}

function getChromeRuntime(): ChromeRuntime | undefined {
  const chromeApi = (globalThis as { chrome?: { runtime?: ChromeRuntime } }).chrome
  return chromeApi?.runtime
}

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
    type: 'START_PUBLISH',
    adsMessages,
    groups,
  }

  const runtime = getChromeRuntime()
  if (!EXTENSION_ID || !runtime?.sendMessage) {
    openGroupTabs(urls)
    return Promise.resolve({ ok: true, via: 'window', warned: true })
  }

  return new Promise((resolve) => {
    try {
      runtime.sendMessage(EXTENSION_ID, message, (response) => {
        if (runtime.lastError) {
          openGroupTabs(urls)
          resolve({ ok: true, via: 'window', warned: true })
          return
        }
        if (
          response &&
          typeof response === 'object' &&
          'ok' in response &&
          (response as { ok: boolean }).ok
        ) {
          resolve({ ok: true, via: 'extension' })
          return
        }
        const error =
          response &&
          typeof response === 'object' &&
          'error' in response &&
          typeof (response as { error: unknown }).error === 'string'
            ? (response as { error: string }).error
            : 'La extensión no pudo iniciar la publicación.'
        resolve({ ok: false, error })
      })
    } catch {
      openGroupTabs(urls)
      resolve({ ok: true, via: 'window', warned: true })
    }
  })
}
