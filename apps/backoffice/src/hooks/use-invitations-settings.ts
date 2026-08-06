import {
  getGetProviderDashboardDashboardProviderGetQueryKey,
  getListLinkedSellersOrganizationsProviderOrganizationIdLinkedSellersGetQueryKey,
  getListOrganizationInvitationsOrganizationsProviderOrganizationIdInvitationsGetQueryKey,
  useAcceptInvitationOrganizationsProviderOrganizationIdInvitationsInvitationIdAcceptPost,
  useListOrganizationInvitationsOrganizationsProviderOrganizationIdInvitationsGet,
  useRejectInvitationOrganizationsProviderOrganizationIdInvitationsInvitationIdRejectPost,
} from '@broker/api'
import { notify, useActiveOrganization } from '@broker/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export function useInvitationsSettings() {
  const { activeOrganization } = useActiveOrganization()
  const orgId = activeOrganization?.id ?? ''
  const queryClient = useQueryClient()
  const [pendingId, setPendingId] = useState<string | null>(null)

  const invitationsQuery =
    useListOrganizationInvitationsOrganizationsProviderOrganizationIdInvitationsGet(orgId, {
      query: { enabled: Boolean(orgId) },
    })
  const acceptRequest =
    useAcceptInvitationOrganizationsProviderOrganizationIdInvitationsInvitationIdAcceptPost()
  const rejectRequest =
    useRejectInvitationOrganizationsProviderOrganizationIdInvitationsInvitationIdRejectPost()

  const invalidate = async () => {
    if (!orgId) return
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey:
          getListOrganizationInvitationsOrganizationsProviderOrganizationIdInvitationsGetQueryKey(
            orgId,
          ),
      }),
      queryClient.invalidateQueries({
        queryKey:
          getListLinkedSellersOrganizationsProviderOrganizationIdLinkedSellersGetQueryKey(orgId),
      }),
      queryClient.invalidateQueries({
        queryKey: getGetProviderDashboardDashboardProviderGetQueryKey(),
      }),
    ])
  }

  return {
    hasActiveOrg: Boolean(activeOrganization),
    sellerLinkRequestsProps: {
      invitations: invitationsQuery.data ?? [],
      isLoading: invitationsQuery.isPending,
      pendingId,
      onAccept: async (invitationId: string) => {
        setPendingId(invitationId)
        try {
          await acceptRequest.mutateAsync({ organizationId: orgId, invitationId })
          await invalidate()
          notify.success('Solicitud aceptada')
        } finally {
          setPendingId(null)
        }
      },
      onReject: async (invitationId: string) => {
        setPendingId(invitationId)
        try {
          await rejectRequest.mutateAsync({ organizationId: orgId, invitationId })
          await invalidate()
          notify.success('Solicitud rechazada')
        } finally {
          setPendingId(null)
        }
      },
    },
  }
}
