const JOIN_PROVIDER_ID_KEY = 'broker:pending-join-provider-id'

export function storeJoinProviderId(providerId: string): void {
  try {
    localStorage.setItem(JOIN_PROVIDER_ID_KEY, providerId)
  } catch {
    // ignore quota / private mode
  }
}

export function peekJoinProviderId(): string | null {
  try {
    return localStorage.getItem(JOIN_PROVIDER_ID_KEY)
  } catch {
    return null
  }
}

export function takeJoinProviderId(): string | null {
  const id = peekJoinProviderId()
  try {
    localStorage.removeItem(JOIN_PROVIDER_ID_KEY)
  } catch {
    // ignore
  }
  return id
}

export function clearJoinProviderId(): void {
  try {
    localStorage.removeItem(JOIN_PROVIDER_ID_KEY)
  } catch {
    // ignore
  }
}
