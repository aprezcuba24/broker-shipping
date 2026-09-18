import { useActiveOrganization } from './active-organization-context'
import { peekInviteToken } from './invite-token-storage'
import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

export type RequireOrganizationProps = {
  onboardingPath?: string
  acceptInvitationPath?: string
  children: ReactNode
}

export function RequireOrganization({
  onboardingPath = '/onboarding',
  acceptInvitationPath = '/accept-invitation',
  children,
}: RequireOrganizationProps) {
  const { organizations, isLoading } = useActiveOrganization()

  if (isLoading) {
    return null
  }

  if (organizations.length === 0) {
    if (peekInviteToken()) {
      return <Navigate to={acceptInvitationPath} replace />
    }
    return <Navigate to={onboardingPath} replace />
  }

  return children
}
