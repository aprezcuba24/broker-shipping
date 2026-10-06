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

/**
 * Bumped on every login, logout, or org change.
 * Startup token validation captures this and must not write back if it moved.
 */
let sessionGeneration = 0
let sessionWriteQueue: Promise<void> = Promise.resolve()

function enqueueSessionWrite<T>(task: () => Promise<T>): Promise<T> {
  const run = sessionWriteQueue.then(task, task)
  sessionWriteQueue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

function bumpSessionGeneration(): number {
  sessionGeneration += 1
  return sessionGeneration
}

async function persistSession(session: ExtensionSession): Promise<void> {
  await chrome.storage.local.set({ [SESSION_STORAGE_KEY]: session })
}

export function sessionGenerationNow(): number {
  return sessionGeneration
}

export function writeSession(session: ExtensionSession): Promise<void> {
  const ticket = bumpSessionGeneration()
  return enqueueSessionWrite(async () => {
    if (ticket !== sessionGeneration) return
    await persistSession(session)
  })
}

export function clearSession(): Promise<void> {
  const ticket = bumpSessionGeneration()
  return enqueueSessionWrite(async () => {
    if (ticket !== sessionGeneration) return
    await persistSession({ status: 'loggedOut' })
  })
}

/**
 * Persist a session refreshed from the network only if no login, logout, or
 * org change happened after `since`. Writes are serialized with clear/write
 * so a logout that arrives mid-validation always wins.
 */
export function commitSessionIfCurrent(
  since: number,
  accessToken: string,
  next: ExtensionSession,
): Promise<void> {
  return enqueueSessionWrite(async () => {
    if (since !== sessionGeneration) return
    const current = await readSession()
    if (current.status === 'loggedOut' || current.accessToken !== accessToken) return
    await persistSession(next)
  })
}
