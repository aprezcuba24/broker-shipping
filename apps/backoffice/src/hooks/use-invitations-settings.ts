import {
  getListOrganizationInvitationsOrganizationsProviderOrganizationIdInvitationsGetQueryKey,
  useAcceptInvitationOrganizationsProviderOrganizationIdInvitationsInvitationIdAcceptPost,
  useListOrganizationInvitationsOrganizationsProviderOrganizationIdInvitationsGet,
  useRejectInvitationOrganizationsProviderOrganizationIdInvitationsInvitationIdRejectPost,
} from '@broker/api'
import { useActiveOrganization } from '@broker/ui'
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
    await queryClient.invalidateQueries({
      queryKey:
        getListOrganizationInvitationsOrganizationsProviderOrganizationIdInvitationsGetQueryKey(
          orgId,
        ),
    })
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
        } finally {
          setPendingId(null)
        }
      },
      onReject: async (invitationId: string) => {
        setPendingId(invitationId)
        try {
          await rejectRequest.mutateAsync({ organizationId: orgId, invitationId })
          await invalidate()
        } finally {
          setPendingId(null)
        }
      },
    },
  }
}
