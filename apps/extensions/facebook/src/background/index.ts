import {
  dispatchSessionAuthMessage,
  isSessionAuthMessage,
  maybeClearSessionOnAuthError,
  readSession,
  requireReadySession,
  toSessionPublic,
  validateStoredSession,
} from '@broker/extension-auth'
import type {
  ExtensionMessage,
  ExtensionResponse,
  FillProductPayload,
  OpenGroupsPayload,
  QueuedProduct,
  TabPublishSession,
} from '../auth/types'
import { TAB_SESSIONS_STORAGE_KEY } from '../constants'
import { loadGroupsConfig } from '../services/groups'
import { searchSellerProducts } from '../services/products'
import { buildPostHtml, buildPostText } from '../share-link'

type TabSessionsMap = Record<string, TabPublishSession>

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

async function handleSearchProducts(query: string): Promise<ExtensionResponse> {
  const ready = await requireReadySession()
  if (!ready.ok) return ready

  try {
    const products = await searchSellerProducts({
      accessToken: ready.accessToken,
      organizationId: ready.organizationId,
      query,
    })
    return { ok: true, products }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'No se pudieron buscar productos'
    await maybeClearSessionOnAuthError(message)
    return { ok: false, error: message }
  }
}

async function handleGetGroups(): Promise<ExtensionResponse> {
  try {
    const groups = await loadGroupsConfig()
    return { ok: true, groups }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'No se pudieron cargar los grupos'
    return { ok: false, error: message }
  }
}

async function readTabSessions(): Promise<TabSessionsMap> {
  const data = await chrome.storage.local.get(TAB_SESSIONS_STORAGE_KEY)
  const raw = data[TAB_SESSIONS_STORAGE_KEY]
  if (!raw || typeof raw !== 'object') return {}
  return raw as TabSessionsMap
}

async function writeTabSessions(sessions: TabSessionsMap): Promise<void> {
  await chrome.storage.local.set({ [TAB_SESSIONS_STORAGE_KEY]: sessions })
}

async function setTabSession(session: TabPublishSession): Promise<void> {
  const sessions = await readTabSessions()
  sessions[String(session.tabId)] = session
  await writeTabSessions(sessions)
}

async function removeTabSession(tabId: number): Promise<void> {
  const sessions = await readTabSessions()
  const key = String(tabId)
  if (!(key in sessions)) return
  delete sessions[key]
  await writeTabSessions(sessions)
}

async function handleGetTabSession(
  tabId: number | undefined,
): Promise<ExtensionResponse> {
  if (tabId == null) {
    return { ok: true, tabSession: null }
  }
  const sessions = await readTabSessions()
  return { ok: true, tabSession: sessions[String(tabId)] ?? null }
}

async function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

async function downloadImage(
  imageUrl: string,
): Promise<{ base64: string; mime: string } | null> {
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
  return image
    ? { base64: image.base64, mime: image.mime }
    : { base64: null, mime: null }
}

function waitForTabComplete(tabId: number, timeoutMs = 15000): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener)
      resolve()
    }, timeoutMs)

    function listener(
      updatedTabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
    ) {
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
            'imageAttached' in r
              ? Boolean((r as { imageAttached?: boolean }).imageAttached)
              : false
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

function cloneQueuedProducts(products: QueuedProduct[]): QueuedProduct[] {
  return products.map((item) => ({
    product: { ...item.product },
    caption: item.caption,
  }))
}

async function handleOpenGroups(
  payload: OpenGroupsPayload,
): Promise<ExtensionResponse> {
  if (payload.groups.length === 0) {
    return { ok: false, error: 'Selecciona al menos un grupo' }
  }
  if (payload.products.length === 0) {
    return { ok: false, error: 'Añade al menos un producto' }
  }
  if (!payload.phone.trim()) {
    return { ok: false, error: 'Teléfono requerido' }
  }

  const opened: Array<{ tabId: number; groupName: string; groupUrl: string }> =
    []
  const products = cloneQueuedProducts(payload.products)

  for (const group of payload.groups) {
    const tab = await chrome.tabs.create({
      url: group.url,
      active: false,
    })
    if (tab.id == null) continue

    const session: TabPublishSession = {
      tabId: tab.id,
      groupName: group.name,
      groupUrl: group.url,
      products,
      phone: payload.phone,
    }
    await setTabSession(session)
    opened.push({
      tabId: tab.id,
      groupName: group.name,
      groupUrl: group.url,
    })
  }

  if (opened.length === 0) {
    return { ok: false, error: 'No se pudieron abrir las pestañas de Facebook' }
  }

  const first = opened[0]!
  await chrome.tabs.update(first.tabId, { active: true })
  const firstTab = await chrome.tabs.get(first.tabId)
  if (firstTab.windowId != null) {
    await chrome.windows.update(firstTab.windowId, { focused: true })
  }

  return {
    ok: true,
    opened: opened.length,
    tabs: opened,
    message:
      opened.length === 1
        ? `Abierta «${first.groupName}». Usa Publicar en cada producto.`
        : `Abiertas ${opened.length} pestañas. En cada grupo, usa Publicar en cada producto.`,
  }
}

async function handleFillProduct(
  payload: FillProductPayload,
  senderTabId: number | undefined,
): Promise<ExtensionResponse> {
  const tabId = senderTabId ?? payload.tabId
  const sessions = await readTabSessions()
  const session = sessions[String(tabId)]
  if (!session) {
    return { ok: false, error: 'No hay sesión de publicación en esta pestaña' }
  }

  const queued = session.products.find(
    (item) => item.product.id === payload.productId,
  )
  if (!queued) {
    return { ok: false, error: 'Producto no encontrado en la sesión' }
  }

  const { product, caption } = queued
  const text = buildPostText(
    product.name,
    caption,
    session.phone,
    product.public_code,
    product.price,
    product.sale_price,
  )
  const html = buildPostHtml(
    product.name,
    caption,
    session.phone,
    product.public_code,
    product.price,
    product.sale_price,
  )

  const { base64: imageBase64, mime: imageMime } = await resolveImage(
    product.image_url,
  )

  const result = await fillTabComposer(
    tabId,
    session.groupName,
    text,
    html,
    imageBase64,
    imageMime,
    { waitForLoad: false },
  )

  if (!result.filled) {
    return {
      ok: false,
      error: `No se abrió el diálogo en «${session.groupName}». Vuelve a pulsar Publicar.`,
    }
  }

  return {
    ok: true,
    filled: result.filled,
    imageAttached: result.imageAttached,
    dialogVisible: result.dialogVisible,
  }
}

chrome.tabs.onRemoved.addListener((tabId) => {
  void removeTabSession(tabId)
})

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, sender, sendResponse) => {
    void (async () => {
      let response: ExtensionResponse
      if (isSessionAuthMessage(message)) {
        response = await dispatchSessionAuthMessage(message)
      } else {
        switch (message.type) {
          case 'OPEN_AUTH':
            response = await handleOpenAuth()
            break
          case 'SEARCH_PRODUCTS':
            response = await handleSearchProducts(message.query)
            break
          case 'GET_GROUPS':
            response = await handleGetGroups()
            break
          case 'OPEN_GROUPS':
            response = await handleOpenGroups(message.payload)
            break
          case 'GET_TAB_SESSION':
            response = await handleGetTabSession(sender.tab?.id)
            break
          case 'FILL_PRODUCT':
            response = await handleFillProduct(message.payload, sender.tab?.id)
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
