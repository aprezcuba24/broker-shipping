import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageWrapper,
  SellerLinkRequestsList,
} from '@broker/ui'
import { Link2 } from 'lucide-react'
import { useInvitationsSettings } from '@/hooks/use-invitations-settings'

export function InvitationsSettingsPage() {
  const { hasActiveOrg, sellerLinkRequestsProps } = useInvitationsSettings()

  if (!hasActiveOrg) {
    return (
      <PageWrapper title="Solicitudes de enlace" description="Selecciona una organización.">
        <p className="text-sm text-muted-foreground">No hay organización activa.</p>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="Solicitudes de enlace"
      description="Gestiona solicitudes de enlace de organizaciones vendedoras."
      icon={Link2}
    >
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes pendientes</CardTitle>
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
