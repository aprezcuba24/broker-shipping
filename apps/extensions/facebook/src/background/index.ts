import {
  dispatchSessionAuthMessage,
  isSessionAuthMessage,
  maybeClearSessionOnAuthError,
  readSession,
  requireReadySession,
  toSessionPublic,
  validateStoredSession,
} from '@broker/extension-auth'
import type { AdsMessageSummary, ExtensionMessage, ExtensionResponse } from '../auth/types'
import { listSellerAdsMessages } from '../services/ads-messages'
import {
  clearPublishQueue,
  parsePublishQueue,
  writePublishQueue,
  type PublishQueueGroup,
} from '../publish-queue'

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

function isAdsMessageSummary(value: unknown): value is AdsMessageSummary {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.description === 'string' &&
    typeof item.code === 'string' &&
    (item.photo_url === null || typeof item.photo_url === 'string')
  )
}

function isPublishGroup(value: unknown): value is PublishQueueGroup {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.url === 'string'
  )
}

async function handleStartPublish(message: {
  adsMessages: unknown
  groups: unknown
}): Promise<ExtensionResponse> {
  if (!Array.isArray(message.adsMessages) || !message.adsMessages.every(isAdsMessageSummary)) {
    return { ok: false, error: 'Anuncios inválidos' }
  }
  if (!Array.isArray(message.groups) || !message.groups.every(isPublishGroup)) {
    return { ok: false, error: 'Grupos inválidos' }
  }
  if (message.adsMessages.length === 0) {
    return { ok: false, error: 'Selecciona al menos un anuncio' }
  }
  if (message.groups.length === 0) {
    return { ok: false, error: 'Selecciona al menos un grupo' }
  }

  const queue = parsePublishQueue({
    adsMessages: message.adsMessages,
    groups: message.groups,
    startedAt: Date.now(),
  })
  if (!queue) {
    return { ok: false, error: 'Cola de publicación inválida' }
  }

  await writePublishQueue(queue)

  for (const group of queue.groups) {
    await chrome.tabs.create({ url: group.url, active: false })
  }

  return { ok: true }
}

async function handleClearPublishQueue(): Promise<ExtensionResponse> {
  await clearPublishQueue()
  return { ok: true }
}

async function dispatchExtensionMessage(
  message: ExtensionMessage,
): Promise<ExtensionResponse> {
  if (isSessionAuthMessage(message)) {
    return dispatchSessionAuthMessage(message)
  }

  switch (message.type) {
    case 'OPEN_AUTH':
      return handleOpenAuth()
    case 'LIST_ADS_MESSAGES':
      return handleListAdsMessages()
    case 'START_PUBLISH':
      return handleStartPublish(message)
    case 'CLEAR_PUBLISH_QUEUE':
      return handleClearPublishQueue()
    default:
      return { ok: false, error: 'Mensaje desconocido' }
  }
}

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    void (async () => {
      sendResponse(await dispatchExtensionMessage(message))
    })()
    return true
  },
)

chrome.runtime.onMessageExternal.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    void (async () => {
      sendResponse(await dispatchExtensionMessage(message))
    })()
    return true
  },
)

void validateStoredSession()
