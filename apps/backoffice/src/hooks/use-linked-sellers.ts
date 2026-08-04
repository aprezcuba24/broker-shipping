import { useListLinkedSellersOrganizationsProviderOrganizationIdLinkedSellersGet } from '@broker/api'
import { useActiveOrganization } from '@broker/ui'
import { useCallback, useMemo } from 'react'

const MISSING_SELLER_NAME = '—'

export function useLinkedSellers() {
  const { activeOrganization } = useActiveOrganization()
  const organizationId = activeOrganization?.id ?? ''

  const sellersQuery = useListLinkedSellersOrganizationsProviderOrganizationIdLinkedSellersGet(
    organizationId,
    { query: { enabled: Boolean(organizationId) } },
  )

  const sellers = sellersQuery.data ?? []

  const sellerNameById = useMemo(
    () => new Map(sellers.map((seller) => [seller.id, seller.name])),
    [sellers],
  )

  const getSellerName = useCallback(
    (id: string | null | undefined) => {
      if (!id) return MISSING_SELLER_NAME
      return sellerNameById.get(id) ?? MISSING_SELLER_NAME
    },
    [sellerNameById],
  )

  return {
    sellers,
    sellerNameById,
    getSellerName,
    isLoading: sellersQuery.isLoading,
  }
}
