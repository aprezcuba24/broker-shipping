import {
  OrganizationType,
  useAuth,
  useMyOrganizationsUsersMyOrganizationsGet,
  type OrganizationPublic,
} from '@broker/api'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  CreateOrganizationUiProvider,
  useOpenCreateOrganization,
} from './create-organization-ui-context'
import {
  clearPreferredOrganizationId,
  peekPreferredOrganizationId,
} from './preferred-organization-storage'

export type OrganizationKind =
  | typeof OrganizationType.provider
  | typeof OrganizationType.seller

export type ActiveOrganizationContextValue = {
  organizations: OrganizationPublic[]
  activeOrganization: OrganizationPublic | null
  setActiveOrganization: (organizationId: string) => void
  organizationType: OrganizationKind | undefined
  isLoading: boolean
  openCreateOrganization: () => void
}

type ActiveOrganizationState = Omit<ActiveOrganizationContextValue, 'openCreateOrganization'>

const ActiveOrganizationContext = createContext<ActiveOrganizationState | null>(null)

export type ActiveOrganizationProviderProps = {
  children: ReactNode
  organizationType?: OrganizationKind
}

export function ActiveOrganizationProvider({
  children,
  organizationType,
}: ActiveOrganizationProviderProps) {
  const { token } = useAuth()
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    peekPreferredOrganizationId(),
  )
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

  // Consume one-shot preference once the invited org is in the list.
  useEffect(() => {
    if (!selectedId || organizations.length === 0) return
    if (organizations.some((org) => org.id === selectedId)) {
      clearPreferredOrganizationId()
    }
  }, [organizations, selectedId])

  const activeOrganization = useMemo(() => {
    if (selectedId) {
      const selected = organizations.find((org) => org.id === selectedId)
      if (selected) return selected
    }
    return organizations[0] ?? null
  }, [organizations, selectedId])

  const setActiveOrganization = useCallback((organizationId: string) => {
    setSelectedId(organizationId)
  }, [])

  const value = useMemo<ActiveOrganizationState>(
    () => ({
      organizations,
      activeOrganization,
      setActiveOrganization,
      organizationType,
      isLoading: Boolean(token) && isPending,
    }),
    [organizations, activeOrganization, setActiveOrganization, organizationType, isPending, token],
  )

  return (
    <ActiveOrganizationContext value={value}>
      <CreateOrganizationUiProvider>{children}</CreateOrganizationUiProvider>
    </ActiveOrganizationContext>
  )
}

export function useActiveOrganization(): ActiveOrganizationContextValue {
  const context = useContext(ActiveOrganizationContext)
  if (!context) {
    throw new Error('useActiveOrganization must be used within ActiveOrganizationProvider')
  }
  const openCreateOrganization = useOpenCreateOrganization()
  return {
    ...context,
    openCreateOrganization,
  }
}
