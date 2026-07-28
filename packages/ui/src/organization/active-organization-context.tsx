import {
  OrganizationType,
  useAuth,
  useMyOrganizationsUsersMyOrganizationsGet,
  type OrganizationPublic,
} from '@broker/api'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type ActiveOrganizationContextValue = {
  organizations: OrganizationPublic[]
  activeOrganization: OrganizationPublic | null
  setActiveOrganization: (organizationId: string) => void
  isLoading: boolean
}

const ActiveOrganizationContext = createContext<ActiveOrganizationContextValue | null>(null)

export type ActiveOrganizationProviderProps = {
  children: ReactNode
  organizationType?: typeof OrganizationType.provider | typeof OrganizationType.seller
}

export function ActiveOrganizationProvider({
  children,
  organizationType,
}: ActiveOrganizationProviderProps) {
  const { token } = useAuth()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data, isPending } = useMyOrganizationsUsersMyOrganizationsGet({
    query: {
      enabled: Boolean(token),
    },
  })

  const organizations = useMemo(() => {
    const list = data ?? []
    if (!organizationType) return list
    return list.filter((org) => org.type === organizationType)
  }, [data, organizationType])

  const activeOrganization = useMemo(() => {
    if (selectedId) {
      const selected = organizations.find((org) => org.id === selectedId)
      if (selected) return selected
    }
    return organizations[0] ?? null
  }, [organizations, selectedId])

  const setActiveOrganization = useCallback(
    (organizationId: string) => {
      if (!organizations.some((org) => org.id === organizationId)) return
      setSelectedId(organizationId)
    },
    [organizations],
  )

  const value = useMemo<ActiveOrganizationContextValue>(
    () => ({
      organizations,
      activeOrganization,
      setActiveOrganization,
      isLoading: Boolean(token) && isPending,
    }),
    [organizations, activeOrganization, setActiveOrganization, isPending, token],
  )

  return <ActiveOrganizationContext value={value}>{children}</ActiveOrganizationContext>
}

export function useActiveOrganization(): ActiveOrganizationContextValue {
  const context = useContext(ActiveOrganizationContext)
  if (!context) {
    throw new Error('useActiveOrganization must be used within ActiveOrganizationProvider')
  }
  return context
}
