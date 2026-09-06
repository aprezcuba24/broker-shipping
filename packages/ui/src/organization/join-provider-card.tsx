import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import {
  AuthPageShell,
  type AuthPortalBranding,
} from '../components/auth/auth-page-shell'

export type JoinProviderStatus =
  | 'loading'
  | 'needs-auth'
  | 'needs-org'
  | 'ready'
  | 'submitting'
  | 'success'
  | 'error'

export type JoinProviderCardProps = {
  status: JoinProviderStatus
  providerName?: string | null
  message?: string | null
  onGoLogin?: () => void
  onGoRegister?: () => void
  onGoOnboarding?: () => void
  onGoProviders?: () => void
  onRetry?: () => void
  portal?: AuthPortalBranding
}

export function JoinProviderCard({
  status,
  providerName = null,
  message = null,
  onGoLogin,
  onGoRegister,
  onGoOnboarding,
  onGoProviders,
  onRetry,
  portal,
}: JoinProviderCardProps) {
  const title =
    status === 'success'
      ? 'Solicitud enviada'
      : status === 'error'
        ? 'No se pudo continuar'
        : status === 'needs-auth'
          ? 'Únete como vendedor'
          : status === 'needs-org'
            ? 'Crea tu organización'
            : status === 'ready' || status === 'submitting'
              ? 'Enviando solicitud…'
              : 'Cargando…'

  let description: string | null = message
  if (!description) {
    if (status === 'loading') {
      description = 'Estamos cargando la información del proveedor.'
    } else if (status === 'needs-auth') {
      description = providerName
        ? `Vas a solicitar vincularte con ${providerName}. Inicia sesión o crea una cuenta para continuar.`
        : 'Inicia sesión o crea una cuenta para solicitar el vínculo con este proveedor.'
    } else if (status === 'needs-org') {
      description = providerName
        ? `Crea tu organización vendedora para solicitar el vínculo con ${providerName}.`
        : 'Para solicitar el vínculo necesitas una organización vendedora.'
    } else if (status === 'ready' || status === 'submitting') {
      description = providerName
        ? `Enviando solicitud a ${providerName}…`
        : 'Enviando la solicitud al proveedor…'
    } else if (status === 'success') {
      description =
        'El proveedor revisará tu solicitud. Te avisaremos cuando la acepte.'
    }
  }

  const card = (
    <Card className="w-full max-w-md border-border shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-headline">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {status === 'needs-auth' ? (
          <>
            {onGoLogin ? (
              <Button type="button" onClick={onGoLogin}>
                Iniciar sesión
              </Button>
            ) : null}
            {onGoRegister ? (
              <Button type="button" variant="outline" onClick={onGoRegister}>
                Crear cuenta
              </Button>
            ) : null}
          </>
        ) : null}
        {status === 'needs-org' && onGoOnboarding ? (
          <Button type="button" onClick={onGoOnboarding}>
            Crear organización
          </Button>
        ) : null}
        {status === 'success' && onGoProviders ? (
          <Button type="button" onClick={onGoProviders}>
            Ver proveedores
          </Button>
        ) : null}
        {status === 'error' && onRetry ? (
          <Button type="button" onClick={onRetry}>
            Reintentar
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )

  if (portal) {
    return <AuthPageShell {...portal}>{card}</AuthPageShell>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">{card}</div>
  )
}
