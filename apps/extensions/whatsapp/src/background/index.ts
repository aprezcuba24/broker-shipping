import { lookupCustomerByPhone } from '../services/customer'
import {
  addPhoneToBlacklist,
  fetchPhoneBlacklistStatus,
  removePhoneFromBlacklist,
  type BlacklistReason,
} from '../services/phone-blacklist'
import type {
  ExtensionMessage,
  ExtensionResponse,
  LookupResponse,
  BlacklistResponse,
  SessionResponse,
  UpdateStatusResponse,
} from '../auth/types'
import { UPDATE_AVAILABLE_KEY } from '../auth/constants'
import {
  dispatchSessionAuthMessage,
  isSessionAuthMessage,
  maybeClearSessionOnAuthError,
  readSession,
  requireReadySession,
  toSessionPublic,
  validateStoredSession,
} from '@broker/extension-auth'

async function setUpdateAvailable(available: boolean): Promise<void> {
  await chrome.storage.local.set({ [UPDATE_AVAILABLE_KEY]: available })
}

async function readUpdateAvailable(): Promise<boolean> {
  const result = await chrome.storage.local.get(UPDATE_AVAILABLE_KEY)
  return result[UPDATE_AVAILABLE_KEY] === true
}

async function handleOpenAuth(): Promise<SessionResponse> {
  const url = chrome.runtime.getURL('popup.html')
  await chrome.windows.create({
    url,
    type: 'popup',
    width: 380,
    height: 560,
  })
  const session = await readSession()
  return { ok: true, session: toSessionPublic(session) }
}

async function handleFocusWhatsApp(): Promise<SessionResponse> {
  const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' })
  const existing = tabs.find((tab) => tab.id != null)
  if (existing?.id != null) {
    await chrome.tabs.update(existing.id, { active: true })
    if (existing.windowId != null) {
      await chrome.windows.update(existing.windowId, { focused: true })
    }
  } else {
    await chrome.tabs.create({ url: 'https://web.whatsapp.com/' })
  }
  const session = await readSession()
  return { ok: true, session: toSessionPublic(session) }
}

async function handleLookupCustomer(phone: string): Promise<LookupResponse> {
  const ready = await requireReadySession()
  if (!ready.ok) return ready

  try {
    const lookup = await lookupCustomerByPhone({
      phone,
      accessToken: ready.accessToken,
      organizationId: ready.organizationId,
    })
    return { ok: true, lookup }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo buscar el cliente'
    await maybeClearSessionOnAuthError(message)
    return { ok: false, error: message }
  }
}

async function handleGetBlacklistStatus(phone: string): Promise<BlacklistResponse> {
  const ready = await requireReadySession()
  if (!ready.ok) return ready

  try {
    const blacklist = await fetchPhoneBlacklistStatus({
      phone,
      accessToken: ready.accessToken,
      organizationId: ready.organizationId,
    })
    return { ok: true, blacklist }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'No se pudo consultar la lista negra'
    await maybeClearSessionOnAuthError(message)
    return { ok: false, error: message }
  }
}

async function handleAddToBlacklist(params: {
  phone: string
  reason: BlacklistReason
  note?: string
}): Promise<BlacklistResponse> {
  const ready = await requireReadySession()
  if (!ready.ok) return ready

  try {
    await addPhoneToBlacklist({
      phone: params.phone,
      reason: params.reason,
      note: params.note,
      accessToken: ready.accessToken,
      organizationId: ready.organizationId,
    })
    const blacklist = await fetchPhoneBlacklistStatus({
      phone: params.phone,
      accessToken: ready.accessToken,
      organizationId: ready.organizationId,
    })
    return { ok: true, blacklist }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'No se pudo agregar a la lista negra'
    await maybeClearSessionOnAuthError(message)
    return { ok: false, error: message }
  }
}

async function handleRemoveFromBlacklist(phone: string): Promise<BlacklistResponse> {
  const ready = await requireReadySession()
  if (!ready.ok) return ready

  try {
    await removePhoneFromBlacklist({
      phone,
      accessToken: ready.accessToken,
      organizationId: ready.organizationId,
    })
    const blacklist = await fetchPhoneBlacklistStatus({
      phone,
      accessToken: ready.accessToken,
      organizationId: ready.organizationId,
    })
    return { ok: true, blacklist }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'No se pudo quitar de la lista negra'
    await maybeClearSessionOnAuthError(message)
    return { ok: false, error: message }
  }
}

async function handleGetUpdateStatus(): Promise<UpdateStatusResponse> {
  return { ok: true, updateAvailable: await readUpdateAvailable() }
}

/** Reload WhatsApp tabs, then apply the pending extension update. */
async function handleApplyUpdate(): Promise<ExtensionResponse> {
  const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' })
  await Promise.all(
    tabs.map((tab) =>
      tab.id != null ? chrome.tabs.reload(tab.id) : Promise.resolve(),
    ),
  )
  await setUpdateAvailable(false)
  chrome.runtime.reload()
  return { ok: true, updateAvailable: false }
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
          case 'FOCUS_WHATSAPP':
            response = await handleFocusWhatsApp()
            break
          case 'LOOKUP_CUSTOMER':
            response = await handleLookupCustomer(message.phone)
            break
          case 'GET_BLACKLIST_STATUS':
            response = await handleGetBlacklistStatus(message.phone)
            break
          case 'ADD_TO_BLACKLIST':
            response = await handleAddToBlacklist({
              phone: message.phone,
              reason: message.reason,
              note: message.note,
            })
            break
          case 'REMOVE_FROM_BLACKLIST':
            response = await handleRemoveFromBlacklist(message.phone)
            break
          case 'GET_UPDATE_STATUS':
            response = await handleGetUpdateStatus()
            break
          case 'APPLY_UPDATE':
            response = await handleApplyUpdate()
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

chrome.runtime.onUpdateAvailable.addListener(() => {
  void setUpdateAvailable(true)
})

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'update' || details.reason === 'install') {
    void setUpdateAvailable(false)
  }
})

void validateStoredSession()

/** Ask Chrome for a store update once per SW wake (rate-limited by the browser). */
chrome.runtime.requestUpdateCheck((status) => {
  if (status === 'update_available') {
    void setUpdateAvailable(true)
  }
})
