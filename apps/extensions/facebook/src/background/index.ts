import {
  dispatchSessionAuthMessage,
  handleShareSession,
  isSessionAuthMessage,
  maybeClearSessionOnAuthError,
  readSession,
  requireReadySession,
  SELLER_APP_URL,
  toSessionPublic,
  validateStoredSession,
} from '@broker/extension-auth'
import type {
  AdsMessageSummary,
  ExtensionMessage,
  ExtensionResponse,
  FillAdMessagePayload,
} from '../auth/types'
import { listSellerAdsMessages } from '../services/ads-messages'
import {
  clearPublishQueue,
  parsePublishQueue,
  readPublishQueue,
  writePublishQueue,
  type PublishQueueGroup,
} from '../publish-queue'
import { buildPostHtml, buildPostText } from '../share-link'

function sellerTabUrlPattern(): string {
  return `${SELLER_APP_URL}/*`
}

function senderOriginIsSeller(sender: chrome.runtime.MessageSender): boolean {
  const origin = sender.origin ?? (sender.url ? new URL(sender.url).origin : null)
  return origin === SELLER_APP_URL
}

async function handleRequestSession(): Promise<ExtensionResponse> {
  try {
    const tabs = await chrome.tabs.query({ url: sellerTabUrlPattern() })
    if (tabs.length === 0) {
      return { ok: false, error: 'App de vendedores no abierta' }
    }
    for (const tab of tabs) {
      if (tab.id === undefined) continue
      chrome.tabs.sendMessage(tab.id, { type: 'REQUEST_SESSION' })
    }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo contactar al seller'
    return { ok: false, error: message }
  }
}

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
    const message = err instanceof Error ? err.message : 'No se pudieron cargar los anuncios'
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
    typeof item.id === 'string' && typeof item.name === 'string' && typeof item.url === 'string'
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

async function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

async function downloadImage(imageUrl: string): Promise<{ base64: string; mime: string } | null> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) return null
    const mime = response.headers.get('content-type') || 'image/jpeg'
    const buffer = await response.arrayBuffer()
    const base64 = await arrayBufferToBase64(buffer)
    return { base64, mime }
  } catch {
    return null
  }
}

async function resolveImage(
  imageUrl: string | null,
): Promise<{ base64: string | null; mime: string | null }> {
  if (!imageUrl) return { base64: null, mime: null }
  const image = await downloadImage(imageUrl)
  return image ? { base64: image.base64, mime: image.mime } : { base64: null, mime: null }
}

function waitForTabComplete(tabId: number, timeoutMs = 15000): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener)
      resolve()
    }, timeoutMs)

    function listener(updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        clearTimeout(timer)
        chrome.tabs.onUpdated.removeListener(listener)
        // Extra settle time for Facebook SPA
        setTimeout(resolve, 1200)
      }
    }

    chrome.tabs.get(tabId).then((tab) => {
      if (tab.status === 'complete') {
        clearTimeout(timer)
        setTimeout(resolve, 1200)
      } else {
        chrome.tabs.onUpdated.addListener(listener)
      }
    })
  })
}

async function fillTabComposer(
  tabId: number,
  groupName: string,
  text: string,
  html: string,
  imageBase64: string | null,
  imageMime: string | null,
  options: { waitForLoad: boolean } = { waitForLoad: true },
): Promise<{ filled: boolean; imageAttached: boolean; dialogVisible: boolean }> {
  if (options.waitForLoad) {
    await waitForTabComplete(tabId)
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  let lastError: unknown = null
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await chrome.tabs.sendMessage(tabId, {
        type: 'FILL_COMPOSER',
        text,
        html,
        imageBase64,
        imageMime,
      })
      if (result && typeof result === 'object' && 'ok' in result) {
        const r = result as ExtensionResponse
        if (r.ok && 'filled' in r) {
          const dialogOk =
            'dialogVisible' in r
              ? Boolean((r as { dialogVisible?: boolean }).dialogVisible)
              : r.filled
          const imageAttached =
            'imageAttached' in r ? Boolean((r as { imageAttached?: boolean }).imageAttached) : false
          return {
            filled: Boolean(r.filled && dialogOk),
            imageAttached,
            dialogVisible: Boolean(dialogOk),
          }
        }
        if (!r.ok) {
          return { filled: false, imageAttached: false, dialogVisible: false }
        }
      }
      break
    } catch (err) {
      lastError = err
      await new Promise((resolve) => setTimeout(resolve, 800))
    }
  }
  if (lastError) {
    console.warn(`[Vendelo360 Facebook] fill failed for «${groupName}»`, lastError)
  }
  return { filled: false, imageAttached: false, dialogVisible: false }
}

async function handleFillAdMessage(
  payload: FillAdMessagePayload,
  senderTabId: number | undefined,
): Promise<ExtensionResponse> {
  if (senderTabId == null) {
    return { ok: false, error: 'No hay pestaña activa' }
  }

  const queue = await readPublishQueue()
  if (!queue || queue.adsMessages.length === 0) {
    return { ok: false, error: 'No hay cola de publicación' }
  }

  const adMessage = queue.adsMessages.find((msg) => msg.id === payload.adMessageId)
  if (!adMessage) {
    return { ok: false, error: 'Mensaje no encontrado en la cola' }
  }

  const text = buildPostText(adMessage.title, adMessage.description)
  const html = buildPostHtml(adMessage.title, adMessage.description)

  const { base64: imageBase64, mime: imageMime } = await resolveImage(adMessage.photo_url)

  // Get group name from queue for logging (first group as fallback)
  const groupName = queue.groups[0]?.name ?? 'grupo'

  const result = await fillTabComposer(senderTabId, groupName, text, html, imageBase64, imageMime, {
    waitForLoad: false,
  })

  if (!result.filled) {
    return {
      ok: false,
      error: `No se abrió el diálogo en «${groupName}». Vuelve a pulsar Publicar.`,
    }
  }

  return {
    ok: true,
    filled: result.filled,
    imageAttached: result.imageAttached,
    dialogVisible: result.dialogVisible,
  }
}

async function dispatchExtensionMessage(
  message: ExtensionMessage,
  senderTabId?: number,
): Promise<ExtensionResponse> {
  if (isSessionAuthMessage(message)) {
    return dispatchSessionAuthMessage(message)
  }

  switch (message.type) {
    case 'REQUEST_SESSION':
      return handleRequestSession()
    case 'OPEN_AUTH':
      return handleOpenAuth()
    case 'LIST_ADS_MESSAGES':
      return handleListAdsMessages()
    case 'START_PUBLISH':
      return handleStartPublish(message)
    case 'CLEAR_PUBLISH_QUEUE':
      return handleClearPublishQueue()
    case 'FILL_AD_MESSAGE':
      return handleFillAdMessage(message.payload, senderTabId)
    default:
      return { ok: false, error: 'Mensaje desconocido' }
  }
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  void (async () => {
    sendResponse(await dispatchExtensionMessage(message, sender.tab?.id))
  })()
  return true
})

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  void (async () => {
    if (!senderOriginIsSeller(sender)) {
      sendResponse({ ok: false, error: 'Origen no autorizado' })
      return
    }
    if (
      !message ||
      typeof message !== 'object' ||
      typeof (message as { type?: unknown }).type !== 'string'
    ) {
      sendResponse({ ok: false, error: 'Mensaje inválido' })
      return
    }
    const typed = message as { type: string; accessToken?: string }
    if (typed.type === 'SHARE_SESSION') {
      if (typeof typed.accessToken !== 'string') {
        sendResponse({ ok: false, error: 'Token requerido' })
        return
      }
      const response = await handleShareSession({
        accessToken: typed.accessToken,
      })
      sendResponse(response)
      return
    }
    sendResponse({ ok: false, error: 'Mensaje no soportado' })
  })()
  return true
})

void validateStoredSession()
