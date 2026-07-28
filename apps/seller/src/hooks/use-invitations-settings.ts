import {
  formatApiError,
  getMyOrganizationsUsersMyOrganizationsGetQueryKey,
  useCreateMemberInvitationOrganizationsOrganizationIdMemberInvitationsPost,
} from '@broker/api'
import { useActiveOrganization } from '@broker/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export function useInvitationsSettings() {
  const { activeOrganization } = useActiveOrganization()
  const orgId = activeOrganization?.id ?? ''
  const queryClient = useQueryClient()
  const [success, setSuccess] = useState<string | null>(null)
  const memberInvite = useCreateMemberInvitationOrganizationsOrganizationIdMemberInvitationsPost()

  return {
    hasActiveOrg: Boolean(activeOrganization),
    memberInviteProps: {
      isSubmitting: memberInvite.isPending,
      successMessage: success,
      error: memberInvite.isError
        ? formatApiError(memberInvite.error, 'No se pudo enviar la invitación.')
        : null,
      onSubmit: async ({ invitee_email }: { invitee_email: string }) => {
        setSuccess(null)
        memberInvite.reset()
        await memberInvite.mutateAsync({
          organizationId: orgId,
          data: { invitee_email },
        })
        setSuccess(`Invitación enviada a ${invitee_email}.`)
        await queryClient.invalidateQueries({
          queryKey: getMyOrganizationsUsersMyOrganizationsGetQueryKey(),
        })
      },
    },
  }
}
