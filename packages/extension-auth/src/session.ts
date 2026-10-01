import type {
  ExtensionSessionAuthenticated,
  SellerOrganization,
  SessionUser,
} from './types'

/**
 * Build authenticated session from user + seller orgs.
 * - 0 orgs → noSellerOrg
 * - 1 org → ready (auto-select)
 * - N orgs → restore previousOrganizationId if still a member, else needsOrgSelection
 */
export function buildAuthenticatedSession(params: {
  accessToken: string
  user: SessionUser
  organizations: SellerOrganization[]
  previousOrganizationId?: string | null
}): ExtensionSessionAuthenticated {
  const { accessToken, user, organizations, previousOrganizationId } = params

  if (organizations.length === 0) {
    return {
      status: 'noSellerOrg',
      accessToken,
      user,
      organizations,
      organizationId: null,
    }
  }

  if (organizations.length === 1) {
    return {
      status: 'ready',
      accessToken,
      user,
      organizations,
      organizationId: organizations[0].id,
    }
  }

  const stillMember =
    previousOrganizationId != null &&
    organizations.some((org) => org.id === previousOrganizationId)

  if (stillMember) {
    return {
      status: 'ready',
      accessToken,
      user,
      organizations,
      organizationId: previousOrganizationId,
    }
  }

  return {
    status: 'needsOrgSelection',
    accessToken,
    user,
    organizations,
    organizationId: null,
  }
}
