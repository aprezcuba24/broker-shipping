import {
  useListOrganizationsOrganizationsGet,
  type Organization,
} from '@broker/api'
import {
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query'
import { createContext, useContext, useState, type ReactNode } from 'react'

export type ActiveOrganizationContextValue = {
  organizations: Organization[]
  activeOrganization: Organization | null
  setActiveOrganization: (organizationId: string) => void
}

const ActiveOrganizationContext =
  createContext<ActiveOrganizationContextValue | null>(null)

export type ActiveOrganizationProviderProps = {
  children: ReactNode
  tenantQueryKeys?: QueryKey[]
}

export function ActiveOrganizationProvider({
  children,
  tenantQueryKeys = [],
}: ActiveOrganizationProviderProps) {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { data: organizations = [], isPending } =
    useListOrganizationsOrganizationsGet()

  const activeId = selectedId ?? organizations[0]?.id
  const activeOrganization =
    organizations.find((org) => org.id === activeId) ?? null

  const setActiveOrganization = (organizationId: string) => {
    if (!organizations.some((org) => org.id === organizationId)) return
    setSelectedId(organizationId)
    for (const queryKey of tenantQueryKeys) {
      void queryClient.invalidateQueries({ queryKey })
    }
  }

  if (isPending) return null

  return (
    <ActiveOrganizationContext
      value={{ organizations, activeOrganization, setActiveOrganization }}
    >
      {children}
    </ActiveOrganizationContext>
  )
}

export function useActiveOrganization(): ActiveOrganizationContextValue {
  const context = useContext(ActiveOrganizationContext)
  if (!context) {
    throw new Error(
      'useActiveOrganization must be used within ActiveOrganizationProvider',
    )
  }
  return context
}
