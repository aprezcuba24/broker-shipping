import {
  formatApiError,
  getListOrganizationInvitationsOrganizationsOrganizationIdInvitationsGetQueryKey,
  useAcceptInvitationOrganizationsOrganizationIdInvitationsInvitationIdAcceptPost,
  useCreateMemberInvitationOrganizationsOrganizationIdMemberInvitationsPost,
  useListOrganizationInvitationsOrganizationsOrganizationIdInvitationsGet,
  useRejectInvitationOrganizationsOrganizationIdInvitationsInvitationIdRejectPost,
} from '@broker/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MemberInviteForm,
  PageWrapper,
  SellerLinkRequestsList,
  useActiveOrganization,
} from '@broker/ui'
import { useQueryClient } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import { useState } from 'react'

export function InvitationsSettingsPage() {
  const { activeOrganization } = useActiveOrganization()
  const orgId = activeOrganization?.id ?? ''
  const queryClient = useQueryClient()
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const invitationsQuery = useListOrganizationInvitationsOrganizationsOrganizationIdInvitationsGet(
    orgId,
    { query: { enabled: Boolean(orgId) } },
  )
  const memberInvite = useCreateMemberInvitationOrganizationsOrganizationIdMemberInvitationsPost()
  const acceptRequest =
    useAcceptInvitationOrganizationsOrganizationIdInvitationsInvitationIdAcceptPost()
  const rejectRequest =
    useRejectInvitationOrganizationsOrganizationIdInvitationsInvitationIdRejectPost()

  const invalidate = async () => {
    if (!orgId) return
    await queryClient.invalidateQueries({
      queryKey:
        getListOrganizationInvitationsOrganizationsOrganizationIdInvitationsGetQueryKey(orgId),
    })
  }

  if (!activeOrganization) {
    return (
      <PageWrapper title="Invitaciones" description="Selecciona una organización.">
        <p className="text-sm text-muted-foreground">No hay organización activa.</p>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="Invitaciones"
      description="Invita miembros a tu organización y gestiona solicitudes de enlace de vendedores."
      icon={Mail}
    >
      <Card>
        <CardHeader>
          <CardTitle>Invitar miembro</CardTitle>
          <CardDescription>
            Se enviará un correo con un enlace de aceptación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberInviteForm
            isSubmitting={memberInvite.isPending}
            successMessage={memberSuccess}
            error={
              memberInvite.isError
                ? formatApiError(memberInvite.error, 'No se pudo enviar la invitación.')
                : null
            }
            onSubmit={async ({ invitee_email }) => {
              setMemberSuccess(null)
              memberInvite.reset()
              await memberInvite.mutateAsync({
                organizationId: orgId,
                data: { invitee_email },
              })
              setMemberSuccess(`Invitación enviada a ${invitee_email}.`)
              await invalidate()
            }}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Solicitudes de enlace pendientes</CardTitle>
          <CardDescription>
            Organizaciones vendedoras que solicitaron enlazarse contigo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SellerLinkRequestsList
            invitations={invitationsQuery.data ?? []}
            isLoading={invitationsQuery.isPending}
            pendingId={pendingId}
            onAccept={async (invitationId) => {
              setPendingId(invitationId)
              try {
                await acceptRequest.mutateAsync({ organizationId: orgId, invitationId })
                await invalidate()
              } finally {
                setPendingId(null)
              }
            }}
            onReject={async (invitationId) => {
              setPendingId(invitationId)
              try {
                await rejectRequest.mutateAsync({ organizationId: orgId, invitationId })
                await invalidate()
              } finally {
                setPendingId(null)
              }
            }}
          />
        </CardContent>
      </Card>
    </PageWrapper>
  )
}
