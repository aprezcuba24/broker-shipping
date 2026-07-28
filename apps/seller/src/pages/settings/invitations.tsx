import {
  formatApiError,
  getMyOrganizationsUsersMyOrganizationsGetQueryKey,
  useCreateMemberInvitationOrganizationsOrganizationIdMemberInvitationsPost,
} from '@broker/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MemberInviteForm,
  PageWrapper,
  useActiveOrganization,
} from '@broker/ui'
import { useQueryClient } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import { useState } from 'react'

export function InvitationsSettingsPage() {
  const { activeOrganization } = useActiveOrganization()
  const orgId = activeOrganization?.id ?? ''
  const queryClient = useQueryClient()
  const [success, setSuccess] = useState<string | null>(null)
  const memberInvite = useCreateMemberInvitationOrganizationsOrganizationIdMemberInvitationsPost()

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
      description="Invita miembros a tu organización vendedora."
      icon={Mail}
    >
      <Card>
        <CardHeader>
          <CardTitle>Invitar miembro</CardTitle>
          <CardDescription>Se enviará un correo con un enlace de aceptación.</CardDescription>
        </CardHeader>
        <CardContent>
          <MemberInviteForm
            isSubmitting={memberInvite.isPending}
            successMessage={success}
            error={
              memberInvite.isError
                ? formatApiError(memberInvite.error, 'No se pudo enviar la invitación.')
                : null
            }
            onSubmit={async ({ invitee_email }) => {
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
            }}
          />
        </CardContent>
      </Card>
    </PageWrapper>
  )
}
