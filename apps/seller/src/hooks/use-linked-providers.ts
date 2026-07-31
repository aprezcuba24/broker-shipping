import {
  useListProvidersOrganizationsSellerProvidersGet,
  type ListProvidersOrganizationsSellerProvidersGetParams,
} from '@broker/api'
import { useCallback, useMemo } from 'react'

const MISSING_PROVIDER_NAME = '—'

export function useLinkedProviders() {
  const providersQuery = useListProvidersOrganizationsSellerProvidersGet(
    {} as ListProvidersOrganizationsSellerProvidersGetParams,
  )

  const providers = providersQuery.data ?? []

  const providerNameById = useMemo(
    () => new Map((providersQuery.data ?? []).map((provider) => [provider.id, provider.name])),
    [providersQuery.data],
  )

  const getProviderName = useCallback(
    (id: string | null | undefined) => {
      if (!id) return MISSING_PROVIDER_NAME
      return providerNameById.get(id) ?? MISSING_PROVIDER_NAME
    },
    [providerNameById],
  )

  const isLoading = providersQuery.isLoading

  return {
    providers,
    providerNameById,
    getProviderName,
    isLoading,
  }
}
