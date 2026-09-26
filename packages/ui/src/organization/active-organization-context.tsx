import {
  OrganizationType,
  useAuth,
  useGetOrganizationOrganizationsOrganizationIdGet,
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
  clearActiveOrganizationId,
  peekActiveOrganizationId,
  storeActiveOrganizationId,
} from './active-organization-storage'
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

function matchesPortalType(
  org: OrganizationPublic,
  organizationType: OrganizationKind | undefined,
): boolean {
  return !organizationType || org.type === organizationType
}

export function ActiveOrganizationProvider({
  children,
  organizationType,
}: ActiveOrganizationProviderProps) {
  const { token, user, isLoading: authLoading } = useAuth()
  const isSuperAdmin = Boolean(user?.is_super_admin)

  const [selectedId, setSelectedId] = useState<string | null>(() =>
    peekPreferredOrganizationId() ?? peekActiveOrganizationId(),
  )

  const { data: membershipOrgs, isPending: membershipPending } =
    useMyOrganizationsUsersMyOrganizationsGet({
      query: {
        enabled: Boolean(token) && !authLoading && !isSuperAdmin,
      },
    })

  const {
    data: directoryOrg,
    isPending: directoryPending,
    isError: directoryError,
  } = useGetOrganizationOrganizationsOrganizationIdGet(selectedId ?? '', {
    query: {
      enabled: Boolean(token && isSuperAdmin && selectedId),
      retry: false,
    },
  })

  useEffect(() => {
    if (!isSuperAdmin) return
    if (!selectedId) return
    if (directoryPending) return
    if (directoryError || (directoryOrg && !matchesPortalType(directoryOrg, organizationType))) {
      clearActiveOrganizationId()
      setSelectedId(null)
    }
  }, [
    isSuperAdmin,
    selectedId,
    directoryPending,
    directoryError,
    directoryOrg,
    organizationType,
  ])

  const organizations = useMemo(() => {
    if (isSuperAdmin) {
      if (directoryOrg && matchesPortalType(directoryOrg, organizationType)) {
        return [directoryOrg]
      }
      return []
    }
    const list = membershipOrgs ?? []
    if (!organizationType) return list
    return list.filter((org) => org.type === organizationType)
  }, [isSuperAdmin, directoryOrg, membershipOrgs, organizationType])

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

  const setActiveOrganization = useCallback(
    (organizationId: string) => {
      setSelectedId(organizationId)
      if (isSuperAdmin) {
        storeActiveOrganizationId(organizationId)
      }
    },
    [isSuperAdmin],
  )

  const isLoading =
    Boolean(token) &&
    (authLoading ||
      (isSuperAdmin
        ? Boolean(selectedId) && directoryPending
        : membershipPending))

  const value = useMemo<ActiveOrganizationState>(
    () => ({
      organizations,
      activeOrganization,
      setActiveOrganization,
      organizationType,
      isLoading,
    }),
    [organizations, activeOrganization, setActiveOrganization, organizationType, isLoading],
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
