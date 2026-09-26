const ACTIVE_ORG_KEY = 'broker:active-organization-id'

/** Persist the organization a super admin is operating on. */
export function storeActiveOrganizationId(organizationId: string): void {
  try {
    localStorage.setItem(ACTIVE_ORG_KEY, organizationId)
  } catch {
    // ignore quota / private mode
  }
}

export function peekActiveOrganizationId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_ORG_KEY)
  } catch {
    return null
  }
}

export function clearActiveOrganizationId(): void {
  try {
    localStorage.removeItem(ACTIVE_ORG_KEY)
  } catch {
    // ignore
  }
}
