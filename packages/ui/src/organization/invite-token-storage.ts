const INVITE_TOKEN_KEY = 'broker:pending-invite-token'

export function storeInviteToken(token: string): void {
  try {
    sessionStorage.setItem(INVITE_TOKEN_KEY, token)
  } catch {
    // ignore quota / private mode
  }
}

export function peekInviteToken(): string | null {
  try {
    return sessionStorage.getItem(INVITE_TOKEN_KEY)
  } catch {
    return null
  }
}

export function takeInviteToken(): string | null {
  const token = peekInviteToken()
  try {
    sessionStorage.removeItem(INVITE_TOKEN_KEY)
  } catch {
    // ignore
  }
  return token
}

export function clearInviteToken(): void {
  try {
    sessionStorage.removeItem(INVITE_TOKEN_KEY)
  } catch {
    // ignore
  }
}
