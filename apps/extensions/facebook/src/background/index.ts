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
  PreparedTab,
  PreparePostsPayload,
  RetryPostsPayload,
} from '../auth/types'
import { loadGroupsConfig } from '../services/groups'
import { searchSellerProducts } from '../services/products'

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
): Promise<boolean> {
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
          return Boolean(r.filled && dialogOk)
        }
        if (!r.ok) return false
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
  return false
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

function summarizePrepare(
  prepared: number,
  failed: number,
  total: number,
  firstName: string,
): string {
  if (failed === 0) {
    return total === 1
      ? `Listo en «${firstName}». Revisa el diálogo y pulsa Publicar.`
      : `Listo en ${prepared} grupos. Revisa cada pestaña y pulsa Publicar.`
  }
  if (prepared === 0) {
    return total === 1
      ? `No se abrió el diálogo en «${firstName}». Usa Reintentar en el panel.`
      : `No se preparó ningún grupo (${failed} fallos). Usa Reintentar en el panel.`
  }
  return `Preparados ${prepared} de ${total}. Usa Reintentar en el panel si hace falta.`
}

async function handlePreparePosts(
  payload: PreparePostsPayload,
): Promise<ExtensionResponse> {
  if (payload.groups.length === 0) {
    return { ok: false, error: 'Selecciona al menos un grupo' }
  }

  const { base64: imageBase64, mime: imageMime } = await resolveImage(
    payload.imageUrl,
  )

  const opened: PreparedTab[] = []

  for (const group of payload.groups) {
    const tab = await chrome.tabs.create({
      url: group.url,
      active: false,
    })
    if (tab.id == null) continue
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

  let prepared = 0
  let failed = 0

  for (const tab of opened) {
    const ok = await fillTabComposer(
      tab.tabId,
      tab.groupName,
      payload.text,
      payload.html,
      imageBase64,
      imageMime,
      { waitForLoad: true },
    )
    if (ok) prepared += 1
    else failed += 1
  }

  return {
    ok: true,
    prepared,
    failed,
    tabs: opened,
    message: summarizePrepare(
      prepared,
      failed,
      opened.length,
      first.groupName,
    ),
  }
}

async function tabStillOpen(tabId: number): Promise<boolean> {
  try {
    await chrome.tabs.get(tabId)
    return true
  } catch {
    return false
  }
}

async function handleRetryPosts(
  payload: RetryPostsPayload,
): Promise<ExtensionResponse> {
  if (payload.tabs.length === 0) {
    return { ok: false, error: 'No hay pestañas de grupos para reintentar' }
  }

  const { base64: imageBase64, mime: imageMime } = await resolveImage(
    payload.imageUrl,
  )

  const resolved: PreparedTab[] = []
  for (const tab of payload.tabs) {
    if (await tabStillOpen(tab.tabId)) {
      resolved.push(tab)
      continue
    }
    // Tab was closed — open it again without treating this as a full publish.
    const created = await chrome.tabs.create({
      url: tab.groupUrl,
      active: false,
    })
    if (created.id == null) continue
    resolved.push({
      tabId: created.id,
      groupName: tab.groupName,
      groupUrl: tab.groupUrl,
    })
  }

  if (resolved.length === 0) {
    return { ok: false, error: 'No se pudieron abrir las pestañas para reintentar' }
  }

  const first = resolved[0]!
  await chrome.tabs.update(first.tabId, { active: true })

  let prepared = 0
  let failed = 0

  for (const tab of resolved) {
    const wasRecreated = !payload.tabs.some((t) => t.tabId === tab.tabId)
    const ok = await fillTabComposer(
      tab.tabId,
      tab.groupName,
      payload.text,
      payload.html,
      imageBase64,
      imageMime,
      { waitForLoad: wasRecreated },
    )
    if (ok) prepared += 1
    else failed += 1
  }

  return {
    ok: true,
    prepared,
    failed,
    tabs: resolved,
    message: summarizePrepare(
      prepared,
      failed,
      resolved.length,
      first.groupName,
    ),
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
          case 'SEARCH_PRODUCTS':
            response = await handleSearchProducts(message.query)
            break
          case 'GET_GROUPS':
            response = await handleGetGroups()
            break
          case 'PREPARE_POSTS':
            response = await handlePreparePosts(message.payload)
            break
          case 'RETRY_POSTS':
            response = await handleRetryPosts(message.payload)
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
