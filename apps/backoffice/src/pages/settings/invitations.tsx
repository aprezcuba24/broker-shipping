import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MemberInviteForm,
  PageWrapper,
  SellerLinkRequestsList,
} from '@broker/ui'
import { Mail } from 'lucide-react'
import { useInvitationsSettings } from '@/hooks/use-invitations-settings'

export function InvitationsSettingsPage() {
  const { hasActiveOrg, memberInviteProps, sellerLinkRequestsProps } =
    useInvitationsSettings()

  if (!hasActiveOrg) {
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
          <MemberInviteForm {...memberInviteProps} />
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
          <SellerLinkRequestsList {...sellerLinkRequestsProps} />
        </CardContent>
      </Card>
    </PageWrapper>
  )
}
