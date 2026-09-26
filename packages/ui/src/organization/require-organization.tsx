import { useAuth } from '@broker/api'
import { useActiveOrganization } from './active-organization-context'
import { peekInviteToken } from './invite-token-storage'
import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

export type RequireOrganizationProps = {
  onboardingPath?: string
  acceptInvitationPath?: string
  directoryPath?: string
  children: ReactNode
}

export function RequireOrganization({
  onboardingPath = '/onboarding',
  acceptInvitationPath = '/accept-invitation',
  directoryPath = '/organizations',
  children,
}: RequireOrganizationProps) {
  const { user } = useAuth()
  const { organizations, isLoading } = useActiveOrganization()

  if (isLoading) {
    return null
  }

  if (organizations.length === 0) {
    if (user?.is_super_admin) {
      return <Navigate to={directoryPath} replace />
    }
    if (peekInviteToken()) {
      return <Navigate to={acceptInvitationPath} replace />
    }
    return <Navigate to={onboardingPath} replace />
  }

  return children
}
