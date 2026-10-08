import { fetchMe, fetchSellerOrganizations, loginRequest, refreshAccessToken } from './auth-api'
import { SESSION_STORAGE_KEY } from './constants'
import { buildAuthenticatedSession } from './session'
import {
  clearSession,
  commitSessionIfCurrent,
  readSession,
  sessionGenerationNow,
  toSessionPublic,
  writeSession,
} from './storage'
import type {
  ExtensionBridgeMessage,
  ExtensionSession,
  ReadySession,
  SessionAuthMessage,
  SessionPublic,
  SessionResponse,
} from './types'

export async function handleLogin(email: string, password: string): Promise<SessionResponse> {
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

/**
 * Validate a token shared by the seller web app and persist it as the
 * extension session. Does NOT clear an existing session if the new token is
 * rejected — the user may already have a valid session locally.
 */
export async function handleShareSession(params: {
  accessToken: string
  organizationId?: string | null
}): Promise<SessionResponse> {
  const { accessToken, organizationId } = params
  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    return { ok: false, error: 'Token inválido' }
  }
  try {
    const user = await fetchMe(accessToken)
    const organizations = await fetchSellerOrganizations(accessToken)
    const session = buildAuthenticatedSession({
      accessToken,
      user,
      organizations,
      previousOrganizationId: organizationId ?? null,
    })
    await writeSession(session)
    return { ok: true, session: toSessionPublic(session) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo validar la sesión'
    return { ok: false, error: message }
  }
}

/**
 * Ask the seller web app to share its session. Resolves with whichever
 * SessionPublic the SW persists in response — or `null` on timeout / error.
 * Useful from popup / sidebar when no token is cached locally.
 */
export async function requestSellerShare(timeoutMs = 4000): Promise<SessionPublic | null> {
  try {
    await chrome.runtime.sendMessage({ type: 'REQUEST_SESSION' })
  } catch {
    return null
  }

  return new Promise<SessionPublic | null>((resolve) => {
    const timer = setTimeout(() => {
      chrome.storage.onChanged.removeListener(onChanged)
      resolve(null)
    }, timeoutMs)

    function onChanged(changes: Record<string, chrome.storage.StorageChange>, area: string) {
      if (area !== 'local') return
      const change = changes[SESSION_STORAGE_KEY]
      if (!change) return
      const next = (change.newValue ?? { status: 'loggedOut' }) as ExtensionSession
      clearTimeout(timer)
      chrome.storage.onChanged.removeListener(onChanged)
      resolve(toSessionPublic(next))
    }

    chrome.storage.onChanged.addListener(onChanged)
  })
}

/** Validate a window.postMessage payload before treating it as a bridge message. */
export function asExtensionBridgeMessage(data: unknown): ExtensionBridgeMessage | null {
  if (!data || typeof data !== 'object') return null
  const candidate = data as Partial<ExtensionBridgeMessage>
  if (candidate.source !== 'vendelo360-extension') return null
  if (candidate.type === 'REQUEST_SESSION') {
    return { source: 'vendelo360-extension', type: 'REQUEST_SESSION' }
  }
  if (candidate.type === 'SHARE_SESSION' && typeof candidate.accessToken === 'string') {
    return {
      source: 'vendelo360-extension',
      type: 'SHARE_SESSION',
      accessToken: candidate.accessToken,
      organizationId:
        typeof candidate.organizationId === 'string'
          ? candidate.organizationId
          : candidate.organizationId === null
            ? null
            : undefined,
    }
  }
  if (candidate.type === 'SHARE_DENIED') {
    return { source: 'vendelo360-extension', type: 'SHARE_DENIED' }
  }
  return null
}

/** Apply a SHARE_SESSION bridge payload from the seller page. */
export async function dispatchBridgeShare(
  message: ExtensionBridgeMessage,
): Promise<SessionResponse> {
  if (message.type === 'SHARE_SESSION') {
    return handleShareSession({
      accessToken: message.accessToken,
      organizationId: message.organizationId,
    })
  }
  return { ok: false, error: 'Mensaje del puente no soportado' }
}

export async function handleLogout(): Promise<SessionResponse> {
  await clearSession()
  return { ok: true, session: { status: 'loggedOut' } }
}

export async function handleGetSession(): Promise<SessionResponse> {
  const session = await readSession()
  return { ok: true, session: toSessionPublic(session) }
}

export async function handleSelectOrg(organizationId: string): Promise<SessionResponse> {
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

export async function requireReadySession(): Promise<ReadySession> {
  const session = await readSession()
  if (session.status === 'loggedOut') {
    return { ok: false, error: 'No hay sesión activa' }
  }
  if (session.status !== 'ready' || !session.organizationId) {
    return { ok: false, error: 'Selecciona una organización primero' }
  }
  return {
    ok: true,
    accessToken: session.accessToken,
    organizationId: session.organizationId,
  }
}

export function maybeClearSessionOnAuthError(message: string): Promise<void> {
  if (
    message.includes('401') ||
    message === 'Credenciales inválidas' ||
    /unauthorized/i.test(message)
  ) {
    return clearSession()
  }
  return Promise.resolve()
}

/**
 * Validate stored token on SW start; clear session if expired/invalid.
 * Does not overwrite a logout, login, or org change that happened while
 * `/users/me` was in flight (that call is what wakes the worker on logout).
 */
export async function validateStoredSession(): Promise<void> {
  const since = sessionGenerationNow()
  const session = await readSession()
  if (session.status === 'loggedOut') return
  const accessToken = session.accessToken

  try {
    const user = await fetchMe(accessToken)
    const organizations = await fetchSellerOrganizations(accessToken)
    let nextAccessToken = accessToken
    try {
      nextAccessToken = await refreshAccessToken(accessToken)
    } catch {
      // Keep the existing token if refresh fails; /users/me already succeeded.
    }
    const next = buildAuthenticatedSession({
      accessToken: nextAccessToken,
      user,
      organizations,
      previousOrganizationId: session.organizationId,
    })
    await commitSessionIfCurrent(since, accessToken, next)
  } catch {
    await commitSessionIfCurrent(since, accessToken, { status: 'loggedOut' })
  }
}

export function isSessionAuthMessage(message: { type: string }): message is SessionAuthMessage {
  return (
    message.type === 'LOGIN' ||
    message.type === 'LOGOUT' ||
    message.type === 'GET_SESSION' ||
    message.type === 'SELECT_ORG' ||
    message.type === 'SHARE_SESSION'
  )
}

export async function dispatchSessionAuthMessage(
  message: SessionAuthMessage,
): Promise<SessionResponse> {
  switch (message.type) {
    case 'LOGIN':
      return handleLogin(message.email, message.password)
    case 'LOGOUT':
      return handleLogout()
    case 'GET_SESSION':
      return handleGetSession()
    case 'SELECT_ORG':
      return handleSelectOrg(message.organizationId)
    case 'SHARE_SESSION':
      return handleShareSession({
        accessToken: message.accessToken,
        organizationId: message.organizationId,
      })
  }
}
