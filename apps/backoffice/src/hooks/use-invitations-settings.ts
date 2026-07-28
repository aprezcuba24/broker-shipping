import {
  formatApiError,
  getListOrganizationInvitationsOrganizationsProviderOrganizationIdInvitationsGetQueryKey,
  useAcceptInvitationOrganizationsProviderOrganizationIdInvitationsInvitationIdAcceptPost,
  useCreateMemberInvitationOrganizationsOrganizationIdMemberInvitationsPost,
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
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const invitationsQuery =
    useListOrganizationInvitationsOrganizationsProviderOrganizationIdInvitationsGet(orgId, {
      query: { enabled: Boolean(orgId) },
    })
  const memberInvite = useCreateMemberInvitationOrganizationsOrganizationIdMemberInvitationsPost()
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
    memberInviteProps: {
      isSubmitting: memberInvite.isPending,
      successMessage: memberSuccess,
      error: memberInvite.isError
        ? formatApiError(memberInvite.error, 'No se pudo enviar la invitación.')
        : null,
      onSubmit: async ({ invitee_email }: { invitee_email: string }) => {
        setMemberSuccess(null)
        memberInvite.reset()
        await memberInvite.mutateAsync({
          organizationId: orgId,
          data: { invitee_email },
        })
        setMemberSuccess(`Invitación enviada a ${invitee_email}.`)
        await invalidate()
      },
    },
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
