import {
  useListOrganizationPlatformProductsOrganizationsOrganizationIdPlatformProductsGet,
  type PlatformProductCode,
} from '@broker/api'
import { useCallback, useMemo } from 'react'

import { useActiveOrganization } from './active-organization-context'

export function useOrganizationPlatformProducts() {
  const { activeOrganization } = useActiveOrganization()
  const organizationId = activeOrganization?.id ?? ''

  const query =
    useListOrganizationPlatformProductsOrganizationsOrganizationIdPlatformProductsGet(
      organizationId,
      {
        query: {
          enabled: Boolean(organizationId),
        },
      },
    )

  const enabledCodes = useMemo(() => {
    const set = new Set<PlatformProductCode>()
    for (const row of query.data ?? []) {
      if (row.enabled) {
        set.add(row.code)
      }
    }
    return set
  }, [query.data])

  const isLoading = Boolean(organizationId) && query.isPending

  const hasProduct = useCallback(
    (code: PlatformProductCode) => enabledCodes.has(code),
    [enabledCodes],
  )

  return {
    products: query.data ?? [],
    enabledCodes,
    hasProduct,
    isLoading,
    isError: query.isError,
  }
}
