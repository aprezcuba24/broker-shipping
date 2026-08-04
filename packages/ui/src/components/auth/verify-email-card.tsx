import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { AuthPageShell, type AuthPortalBranding } from './auth-page-shell'

export type VerifyEmailStatus = 'loading' | 'success' | 'error' | 'missing'

export type VerifyEmailCardProps = {
  title?: string
  status: VerifyEmailStatus
  message: string
  loginHref?: string
  footer?: ReactNode
  portal?: AuthPortalBranding
}

export function VerifyEmailCard({
  title = 'Confirmación de correo',
  status,
  message,
  loginHref = '/login',
  footer = null,
  portal,
}: VerifyEmailCardProps) {
  const description =
    status === 'loading'
      ? 'Estamos confirmando tu correo…'
      : status === 'success'
        ? 'Tu cuenta ya está lista.'
        : status === 'missing'
          ? 'Falta el enlace de confirmación.'
          : 'No se pudo confirmar el correo.'

  const card = (
    <Card className="w-full max-w-md border-border shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-headline">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p
          className={
            status === 'error' || status === 'missing'
              ? 'text-sm text-destructive'
              : 'text-sm text-muted-foreground'
          }
          role={status === 'error' || status === 'missing' ? 'alert' : 'status'}
        >
          {message}
        </p>
        {status !== 'loading' ? (
          <Button asChild className="w-full">
            <Link to={status === 'success' ? `${loginHref}?verified=1` : loginHref}>
              Ir al inicio de sesión
            </Link>
          </Button>
        ) : null}
        {footer}
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
