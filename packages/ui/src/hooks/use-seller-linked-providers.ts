import { useListProvidersOrganizationsSellerProvidersGet } from '@broker/api'
import { useCallback, useMemo } from 'react'

export function useSellerLinkedProviders() {
  const { data: providers = [], isLoading, isError } =
    useListProvidersOrganizationsSellerProvidersGet()

  const providerMap = useMemo(
    () => new Map(providers.map((provider) => [provider.id, provider.name])),
    [providers],
  )

  const getProviderName = useCallback(
    (providerId: string, fallback = '—') =>
      providerMap.get(providerId) ?? fallback,
    [providerMap],
  )

  return { providers, providerMap, getProviderName, isLoading, isError }
}
