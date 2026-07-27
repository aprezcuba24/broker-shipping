import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

export type AcceptInvitationStatus = 'loading' | 'success' | 'error' | 'needs-auth' | 'needs-org'

export type AcceptInvitationCardProps = {
  status: AcceptInvitationStatus
  message?: string | null
  onRetry?: () => void
  onGoHome?: () => void
  onGoLogin?: () => void
  onGoOnboarding?: () => void
}

export function AcceptInvitationCard({
  status,
  message = null,
  onRetry,
  onGoHome,
  onGoLogin,
  onGoOnboarding,
}: AcceptInvitationCardProps) {
  const title =
    status === 'success'
      ? 'Invitación aceptada'
      : status === 'error'
        ? 'No se pudo aceptar'
        : status === 'needs-auth'
          ? 'Inicia sesión para continuar'
          : status === 'needs-org'
            ? 'Crea tu organización primero'
            : 'Aceptando invitación…'

  const description =
    message ??
    (status === 'loading'
      ? 'Estamos procesando tu invitación.'
      : status === 'needs-auth'
        ? 'Debes iniciar sesión o crear una cuenta con el correo de la invitación.'
        : status === 'needs-org'
          ? 'Para aceptar este enlace comercial necesitas una organización vendedora.'
          : null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-headline">{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {status === 'success' && onGoHome ? (
            <Button type="button" onClick={onGoHome}>
              Ir al inicio
            </Button>
          ) : null}
          {status === 'error' && onRetry ? (
            <Button type="button" onClick={onRetry}>
              Reintentar
            </Button>
          ) : null}
          {status === 'needs-auth' && onGoLogin ? (
            <Button type="button" onClick={onGoLogin}>
              Iniciar sesión
            </Button>
          ) : null}
          {status === 'needs-org' && onGoOnboarding ? (
            <Button type="button" onClick={onGoOnboarding}>
              Crear organización
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
