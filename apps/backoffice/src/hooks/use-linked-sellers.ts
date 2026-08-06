import {
  getGetProviderDashboardDashboardProviderGetQueryKey,
  getListLinkedSellersOrganizationsProviderOrganizationIdLinkedSellersGetQueryKey,
  useListLinkedSellersOrganizationsProviderOrganizationIdLinkedSellersGet,
  usePatchSellerLinkOrganizationsProviderOrganizationIdLinkedSellersSellerOrganizationIdPatch,
  type LinkedSellerPublic,
} from '@broker/api'
import { useActiveOrganization, useAsyncAction } from '@broker/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'

const MISSING_SELLER_NAME = '—'

export function useLinkedSellers() {
  const { activeOrganization } = useActiveOrganization()
  const organizationId = activeOrganization?.id ?? ''
  const queryClient = useQueryClient()
  const [unlinkingSellerId, setUnlinkingSellerId] = useState<string | null>(null)

  const sellersQuery = useListLinkedSellersOrganizationsProviderOrganizationIdLinkedSellersGet(
    organizationId,
    { query: { enabled: Boolean(organizationId) } },
  )

  const patchMutation =
    usePatchSellerLinkOrganizationsProviderOrganizationIdLinkedSellersSellerOrganizationIdPatch()

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

  const invalidateLinked = useCallback(async () => {
    if (!organizationId) return
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey:
          getListLinkedSellersOrganizationsProviderOrganizationIdLinkedSellersGetQueryKey(
            organizationId,
          ),
      }),
      queryClient.invalidateQueries({
        queryKey: getGetProviderDashboardDashboardProviderGetQueryKey(),
      }),
    ])
  }, [organizationId, queryClient])

  const unlink = useAsyncAction(
    async (seller: LinkedSellerPublic) => {
      if (!organizationId) return
      setUnlinkingSellerId(seller.id)
      try {
        await patchMutation.mutateAsync({
          organizationId,
          sellerOrganizationId: seller.id,
          data: { is_active: false },
        })
      } finally {
        setUnlinkingSellerId(null)
      }
    },
    async () => {
      await invalidateLinked()
    },
    undefined,
    { success: 'Organización desvinculada', error: true },
  )

  return {
    sellers,
    sellerNameById,
    getSellerName,
    isLoading: sellersQuery.isLoading,
    unlink: unlink.run,
    isUnlinking: unlink.isPending,
    unlinkingSellerId,
    invalidateLinked,
  }
}
