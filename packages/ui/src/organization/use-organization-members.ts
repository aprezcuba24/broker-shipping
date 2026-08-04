import {
  formatApiError,
  getListMemberInvitationsOrganizationsOrganizationIdMemberInvitationsGetQueryKey,
  getListMembersOrganizationsOrganizationIdMembersGetQueryKey,
  useCancelInvitationOrganizationsOrganizationIdInvitationsInvitationIdDelete,
  useCreateMemberInvitationOrganizationsOrganizationIdMemberInvitationsPost,
  useListMemberInvitationsOrganizationsOrganizationIdMemberInvitationsGet,
  useListMembersOrganizationsOrganizationIdMembersGet,
} from '@broker/api'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'

import { useActiveOrganization } from './active-organization-context'
import { useResetOnChange } from '../hooks/use-reset-on-change'
import type { MemberInviteFields } from './member-invite-form'

export function useOrganizationMembers() {
  const { activeOrganization } = useActiveOrganization()
  const orgId = activeOrganization?.id ?? ''
  const queryClient = useQueryClient()
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const membersQuery = useListMembersOrganizationsOrganizationIdMembersGet(orgId, {
    query: { enabled: Boolean(orgId) },
  })
  const invitationsQuery = useListMemberInvitationsOrganizationsOrganizationIdMemberInvitationsGet(
    orgId,
    { query: { enabled: Boolean(orgId) } },
  )
  const createInvite = useCreateMemberInvitationOrganizationsOrganizationIdMemberInvitationsPost()
  const cancelInvite =
    useCancelInvitationOrganizationsOrganizationIdInvitationsInvitationIdDelete()

  useResetOnChange({
    resetOnChange: [orgId],
    getQueryKey: () => getListMembersOrganizationsOrganizationIdMembersGetQueryKey(orgId),
  })
  useResetOnChange({
    resetOnChange: [orgId],
    getQueryKey: () =>
      getListMemberInvitationsOrganizationsOrganizationIdMemberInvitationsGetQueryKey(orgId),
  })

  const invalidate = useCallback(async () => {
    if (!orgId) return
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getListMembersOrganizationsOrganizationIdMembersGetQueryKey(orgId),
      }),
      queryClient.invalidateQueries({
        queryKey:
          getListMemberInvitationsOrganizationsOrganizationIdMemberInvitationsGetQueryKey(orgId),
      }),
    ])
  }, [orgId, queryClient])

  const clearInviteError = useCallback(() => {
    setInviteError(null)
    createInvite.reset()
  }, [createInvite])

  const onInviteSubmit = useCallback(
    async ({ invitee_email }: MemberInviteFields) => {
      setInviteError(null)
      createInvite.reset()
      try {
        await createInvite.mutateAsync({
          organizationId: orgId,
          data: { invitee_email },
        })
        await invalidate()
      } catch (err) {
        setInviteError(formatApiError(err, 'No se pudo enviar la invitación.'))
        throw err
      }
    },
    [createInvite, invalidate, orgId],
  )

  const cancelInvitation = useCallback(
    async (invitationId: string) => {
      setCancellingId(invitationId)
      try {
        await cancelInvite.mutateAsync({ organizationId: orgId, invitationId })
        await invalidate()
      } finally {
        setCancellingId(null)
      }
    },
    [cancelInvite, invalidate, orgId],
  )

  return {
    hasActiveOrg: Boolean(activeOrganization),
    members: membersQuery.data ?? [],
    membersLoading: membersQuery.isLoading,
    invitations: invitationsQuery.data ?? [],
    invitationsLoading: invitationsQuery.isLoading,
    cancellingId,
    inviteDialog: {
      isSubmitting: createInvite.isPending,
      error: inviteError,
      clearError: clearInviteError,
      onSubmit: onInviteSubmit,
    },
    cancelInvitation,
  }
}
