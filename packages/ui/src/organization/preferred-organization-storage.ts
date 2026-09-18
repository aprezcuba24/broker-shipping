const PREFERRED_ORG_KEY = 'broker:preferred-organization-id'

/** Remember which org to open after accepting an invite (or similar). */
export function storePreferredOrganizationId(organizationId: string): void {
  try {
    localStorage.setItem(PREFERRED_ORG_KEY, organizationId)
  } catch {
    // ignore quota / private mode
  }
}

export function peekPreferredOrganizationId(): string | null {
  try {
    return localStorage.getItem(PREFERRED_ORG_KEY)
  } catch {
    return null
  }
}

export function clearPreferredOrganizationId(): void {
  try {
    localStorage.removeItem(PREFERRED_ORG_KEY)
  } catch {
    // ignore
  }
}
