import { fetchMe, fetchSellerOrganizations, loginRequest } from './auth-api'
import { buildAuthenticatedSession } from './session'
import {
  clearSession,
  readSession,
  toSessionPublic,
  writeSession,
} from './storage'
import type {
  ReadySession,
  SessionAuthMessage,
  SessionResponse,
} from './types'

export async function handleLogin(
  email: string,
  password: string,
): Promise<SessionResponse> {
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
    const message =
      err instanceof Error ? err.message : 'No se pudo iniciar sesión'
    return { ok: false, error: message }
  }
}

export async function handleLogout(): Promise<SessionResponse> {
  await clearSession()
  return { ok: true, session: { status: 'loggedOut' } }
}

export async function handleGetSession(): Promise<SessionResponse> {
  const session = await readSession()
  return { ok: true, session: toSessionPublic(session) }
}

export async function handleSelectOrg(
  organizationId: string,
): Promise<SessionResponse> {
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

/** Validate stored token on SW start; clear session if expired/invalid. */
export async function validateStoredSession(): Promise<void> {
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

export function isSessionAuthMessage(
  message: { type: string },
): message is SessionAuthMessage {
  return (
    message.type === 'LOGIN' ||
    message.type === 'LOGOUT' ||
    message.type === 'GET_SESSION' ||
    message.type === 'SELECT_ORG'
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
  }
}
