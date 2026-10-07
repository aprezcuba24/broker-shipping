import {
  dispatchSessionAuthMessage,
  isSessionAuthMessage,
  maybeClearSessionOnAuthError,
  readSession,
  requireReadySession,
  toSessionPublic,
  validateStoredSession,
} from '@broker/extension-auth'
import type { ExtensionMessage, ExtensionResponse } from '../auth/types'
import { listSellerAdsMessages } from '../services/ads-messages'

async function handleOpenAuth(): Promise<ExtensionResponse> {
  const url = chrome.runtime.getURL('popup.html')
  await chrome.windows.create({
    url,
    type: 'popup',
    width: 420,
    height: 640,
  })
  const session = await readSession()
  return { ok: true, session: toSessionPublic(session) }
}

async function handleListAdsMessages(): Promise<ExtensionResponse> {
  const ready = await requireReadySession()
  if (!ready.ok) return ready

  try {
    const adsMessages = await listSellerAdsMessages({
      accessToken: ready.accessToken,
      organizationId: ready.organizationId,
    })
    return { ok: true, adsMessages }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'No se pudieron cargar los anuncios'
    await maybeClearSessionOnAuthError(message)
    return { ok: false, error: message }
  }
}

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    void (async () => {
      let response: ExtensionResponse
      if (isSessionAuthMessage(message)) {
        response = await dispatchSessionAuthMessage(message)
      } else {
        switch (message.type) {
          case 'OPEN_AUTH':
            response = await handleOpenAuth()
            break
          case 'LIST_ADS_MESSAGES':
            response = await handleListAdsMessages()
            break
          default:
            response = { ok: false, error: 'Mensaje desconocido' }
        }
      }
      sendResponse(response)
    })()
    return true
  },
)

void validateStoredSession()
