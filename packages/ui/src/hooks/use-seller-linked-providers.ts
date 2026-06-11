import {
  getListProvidersOrganizationsSellerProvidersGetQueryKey,
  useListProvidersOrganizationsSellerProvidersGet,
} from '@broker/api'
import { useCallback, useMemo } from 'react'
import { useActiveOrganization } from '../organization/active-organization-context'
import { useResetOnChange } from './use-reset-on-change'

export function useSellerLinkedProviders() {
  const { activeOrganization } = useActiveOrganization()
  const {
    data: providers = [],
    isLoading,
    isError,
  } = useListProvidersOrganizationsSellerProvidersGet()

  useResetOnChange({
    resetOnChange: [activeOrganization?.id],
    getQueryKey: getListProvidersOrganizationsSellerProvidersGetQueryKey,
  })

  const providerMap = useMemo(
    () => new Map(providers.map((provider) => [provider.id, provider.name])),
    [providers],
  )

  const getProviderName = useCallback(
    (providerId: string, fallback = '—') => providerMap.get(providerId) ?? fallback,
    [providerMap],
  )

  return { providers, providerMap, getProviderName, isLoading, isError }
}
