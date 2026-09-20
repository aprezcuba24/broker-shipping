import { SESSION_STORAGE_KEY } from './constants'
import type { ExtensionSession, SessionPublic } from './types'

export function toSessionPublic(session: ExtensionSession): SessionPublic {
  if (session.status === 'loggedOut') {
    return { status: 'loggedOut' }
  }
  return {
    status: session.status,
    user: session.user,
    organizations: session.organizations,
    organizationId: session.organizationId,
  }
}

export async function readSession(): Promise<ExtensionSession> {
  const result = await chrome.storage.local.get(SESSION_STORAGE_KEY)
  const raw = result[SESSION_STORAGE_KEY]
  if (!raw || typeof raw !== 'object') {
    return { status: 'loggedOut' }
  }
  const session = raw as ExtensionSession
  if (session.status === 'loggedOut') return session
  if (
    typeof session.accessToken !== 'string' ||
    !session.user ||
    !Array.isArray(session.organizations)
  ) {
    return { status: 'loggedOut' }
  }
  return session
}

export async function writeSession(session: ExtensionSession): Promise<void> {
  await chrome.storage.local.set({ [SESSION_STORAGE_KEY]: session })
}

export async function clearSession(): Promise<void> {
  await chrome.storage.local.set({
    [SESSION_STORAGE_KEY]: { status: 'loggedOut' } satisfies ExtensionSession,
  })
}
