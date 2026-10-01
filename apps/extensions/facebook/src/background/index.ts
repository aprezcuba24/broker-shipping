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
  PreparePostPayload,
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

async function handlePreparePost(
  payload: PreparePostPayload,
): Promise<ExtensionResponse> {
  let imageBase64: string | null = null
  let imageMime: string | null = null

  if (payload.imageUrl) {
    const image = await downloadImage(payload.imageUrl)
    if (image) {
      imageBase64 = image.base64
      imageMime = image.mime
    }
  }

  const tabs = await chrome.tabs.query({
    url: ['https://www.facebook.com/*', 'https://web.facebook.com/*'],
  })
  let tab = tabs.find((t) => t.active && t.id != null) ?? tabs.find((t) => t.id != null)

  if (tab?.id != null) {
    await chrome.tabs.update(tab.id, { url: payload.groupUrl, active: true })
    if (tab.windowId != null) {
      await chrome.windows.update(tab.windowId, { focused: true })
    }
  } else {
    tab = await chrome.tabs.create({ url: payload.groupUrl, active: true })
  }

  if (tab.id == null) {
    return { ok: false, error: 'No se pudo abrir el grupo de Facebook' }
  }

  const tabId = tab.id

  // Wait for navigation + Facebook feed to render the create-post control
  await waitForTabComplete(tabId)
  await new Promise((resolve) => setTimeout(resolve, 2000))

  try {
    let lastError: unknown = null
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await chrome.tabs.sendMessage(tabId, {
          type: 'FILL_COMPOSER',
          text: payload.text,
          html: payload.html,
          imageBase64,
          imageMime,
        })
        if (result && typeof result === 'object' && 'ok' in result) {
          const r = result as ExtensionResponse
          if (r.ok && 'filled' in r) {
            const dialogOk =
              'dialogVisible' in r ? Boolean((r as { dialogVisible?: boolean }).dialogVisible) : r.filled
            return {
              ok: true,
              filled: r.filled,
              imageAttached: r.imageAttached,
              message: r.filled && dialogOk
                ? `Listo en «${payload.groupName}». Mira el diálogo en el centro y pulsa Publicar.`
                : `No quedó abierto el diálogo en «${payload.groupName}». El texto está en el portapapeles: abre «Crear publicación» y pega (Ctrl+V).`,
            }
          }
          if (!r.ok) return r
        }
        break
      } catch (err) {
        lastError = err
        await new Promise((resolve) => setTimeout(resolve, 800))
      }
    }
    if (lastError) {
      return {
        ok: true,
        filled: false,
        imageAttached: Boolean(imageBase64),
        message:
          'La página aún no está lista. Recarga el grupo o pega el texto desde el portapapeles y publica a mano.',
      }
    }
    return {
      ok: true,
      filled: false,
      imageAttached: false,
      message: 'Abre el grupo y revisa el aviso en la página.',
    }
  } catch {
    return {
      ok: true,
      filled: false,
      imageAttached: Boolean(imageBase64),
      message:
        'La página aún no está lista. Recarga el grupo o pega el texto desde el portapapeles y publica a mano.',
    }
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
          case 'PREPARE_POST':
            response = await handlePreparePost(message.payload)
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
