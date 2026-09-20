import { fetchMe, fetchSellerOrganizations, loginRequest } from '../auth/api'
import type { ExtensionMessage, ExtensionResponse } from '../auth/types'
import { buildAuthenticatedSession } from '../auth/session'
import {
  clearSession,
  readSession,
  toSessionPublic,
  writeSession,
} from '../auth/storage'

async function handleLogin(
  email: string,
  password: string,
): Promise<ExtensionResponse> {
  try {
    const accessToken = await loginRequest(email.trim(), password)
    const user = await fetchMe(accessToken)
    const organizations = await fetchSellerOrganizations(accessToken)
    const session = buildAuthenticatedSession({
      accessToken,
      user,
      organizations,
      previousOrganizationId: null,
    })
    await writeSession(session)
    return { ok: true, session: toSessionPublic(session) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo iniciar sesión'
    return { ok: false, error: message }
  }
}

async function handleLogout(): Promise<ExtensionResponse> {
  await clearSession()
  return { ok: true, session: { status: 'loggedOut' } }
}

async function handleGetSession(): Promise<ExtensionResponse> {
  const session = await readSession()
  return { ok: true, session: toSessionPublic(session) }
}

async function handleSelectOrg(organizationId: string): Promise<ExtensionResponse> {
  const session = await readSession()
  if (session.status === 'loggedOut') {
    return { ok: false, error: 'No hay sesión activa' }
  }
  const org = session.organizations.find((o) => o.id === organizationId)
  if (!org) {
    return { ok: false, error: 'Organización no válida' }
  }
  const next = {
    ...session,
    status: 'ready' as const,
    organizationId: org.id,
  }
  await writeSession(next)
  return { ok: true, session: toSessionPublic(next) }
}

async function handleOpenAuth(): Promise<ExtensionResponse> {
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

async function handleFocusWhatsApp(): Promise<ExtensionResponse> {
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

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    void (async () => {
      switch (message.type) {
        case 'LOGIN':
          sendResponse(await handleLogin(message.email, message.password))
          break
        case 'LOGOUT':
          sendResponse(await handleLogout())
          break
        case 'GET_SESSION':
          sendResponse(await handleGetSession())
          break
        case 'SELECT_ORG':
          sendResponse(await handleSelectOrg(message.organizationId))
          break
        case 'OPEN_AUTH':
          sendResponse(await handleOpenAuth())
          break
        case 'FOCUS_WHATSAPP':
          sendResponse(await handleFocusWhatsApp())
          break
        default:
          sendResponse({ ok: false, error: 'Mensaje desconocido' })
      }
    })()
    return true
  },
)

/** Validate stored token on SW start; clear session if expired/invalid. */
async function validateStoredSession(): Promise<void> {
  const session = await readSession()
  if (session.status === 'loggedOut') return

  try {
    const user = await fetchMe(session.accessToken)
    const organizations = await fetchSellerOrganizations(session.accessToken)
    const next = buildAuthenticatedSession({
      accessToken: session.accessToken,
      user,
      organizations,
      previousOrganizationId: session.organizationId,
    })
    await writeSession(next)
  } catch {
    await clearSession()
  }
}

void validateStoredSession()
