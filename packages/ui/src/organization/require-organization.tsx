import { useActiveOrganization } from './active-organization-context'
import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

export type RequireOrganizationProps = {
  onboardingPath?: string
  children: ReactNode
}

export function RequireOrganization({
  onboardingPath = '/onboarding',
  children,
}: RequireOrganizationProps) {
  const { organizations, isLoading } = useActiveOrganization()

  if (isLoading) {
    return null
  }

  if (organizations.length === 0) {
    return <Navigate to={onboardingPath} replace />
  }

  return children
}
