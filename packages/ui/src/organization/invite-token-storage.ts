const INVITE_TOKEN_KEY = 'broker:pending-invite-token'
const INVITE_META_KEY = 'broker:pending-invite-meta'

export type PendingInviteMeta = {
  organizationName: string
  inviteeEmail: string
}

export function storeInviteToken(token: string): void {
  try {
    localStorage.setItem(INVITE_TOKEN_KEY, token)
  } catch {
    // ignore quota / private mode
  }
}

export function peekInviteToken(): string | null {
  try {
    return localStorage.getItem(INVITE_TOKEN_KEY)
  } catch {
    return null
  }
}

export function takeInviteToken(): string | null {
  const token = peekInviteToken()
  try {
    localStorage.removeItem(INVITE_TOKEN_KEY)
  } catch {
    // ignore
  }
  return token
}

export function clearInviteToken(): void {
  try {
    localStorage.removeItem(INVITE_TOKEN_KEY)
  } catch {
    // ignore
  }
}

export function storeInviteMeta(meta: PendingInviteMeta): void {
  try {
    localStorage.setItem(INVITE_META_KEY, JSON.stringify(meta))
  } catch {
    // ignore quota / private mode
  }
}

export function peekInviteMeta(): PendingInviteMeta | null {
  try {
    const raw = localStorage.getItem(INVITE_META_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PendingInviteMeta
    if (
      typeof parsed?.organizationName === 'string' &&
      typeof parsed?.inviteeEmail === 'string'
    ) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function clearInviteMeta(): void {
  try {
    localStorage.removeItem(INVITE_META_KEY)
  } catch {
    // ignore
  }
}

/** Clears both token and cached org/email meta. */
export function clearPendingInvite(): void {
  clearInviteToken()
  clearInviteMeta()
}
