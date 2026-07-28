import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MemberInviteForm,
  PageWrapper,
} from '@broker/ui'
import { Mail } from 'lucide-react'
import { useInvitationsSettings } from '@/hooks/use-invitations-settings'

export function InvitationsSettingsPage() {
  const { hasActiveOrg, memberInviteProps } = useInvitationsSettings()

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
      description="Invita miembros a tu organización vendedora."
      icon={Mail}
    >
      <Card>
        <CardHeader>
          <CardTitle>Invitar miembro</CardTitle>
          <CardDescription>Se enviará un correo con un enlace de aceptación.</CardDescription>
        </CardHeader>
        <CardContent>
          <MemberInviteForm {...memberInviteProps} />
        </CardContent>
      </Card>
    </PageWrapper>
  )
}
