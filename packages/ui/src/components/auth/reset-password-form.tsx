import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import type { z } from 'zod'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '../ui/field'
import { Input } from '../ui/input'
import { AuthPageShell, type AuthPortalBranding } from './auth-page-shell'
import { AuthFormLink } from './login-form'

export type ResetPasswordFields = {
  password: string
  confirmPassword: string
}

export type ResetPasswordFormProps = {
  title?: string
  description?: string
  token: string
  schema: z.ZodObject<{
    password: z.ZodString
    confirmPassword: z.ZodString
  }>
  onSubmit: (values: ResetPasswordFields) => void | Promise<void>
  isSubmitting?: boolean
  error?: string | null
  successMessage?: string | null
  loginHref?: string
  missingToken?: boolean
  footer?: ReactNode
  portal?: AuthPortalBranding
}

function withResetParam(href: string): string {
  const [path, query = ''] = href.split('?')
  const params = new URLSearchParams(query)
  params.set('reset', '1')
  const q = params.toString()
  return q ? `${path}?${q}` : path
}

export function ResetPasswordForm({
  title = 'Nueva contraseña',
  description = 'Elige una contraseña nueva para tu cuenta.',
  token,
  schema,
  onSubmit,
  isSubmitting = false,
  error = null,
  successMessage = null,
  loginHref = '/login',
  missingToken = false,
  footer = null,
  portal,
}: ResetPasswordFormProps) {
  const form = useForm<ResetPasswordFields>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const loginTo = successMessage ? withResetParam(loginHref) : loginHref
  const isMissing = missingToken || !token
  const heading = isMissing
    ? 'Enlace incompleto'
    : successMessage
      ? 'Contraseña actualizada'
      : title
  const subheading = isMissing
    ? 'Falta el enlace de recuperación.'
    : successMessage
      ? 'Ya puedes iniciar sesión con tu nueva contraseña.'
      : description

  const card = (
    <Card className="w-full max-w-md border-border shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-headline">{heading}</CardTitle>
        <CardDescription>{subheading}</CardDescription>
      </CardHeader>
      <CardContent>
        {isMissing ? (
          <div className="space-y-4">
            <p className="text-sm text-destructive" role="alert">
              El enlace de recuperación no es válido o está incompleto.
            </p>
            <Button asChild className="w-full">
              <Link to={loginTo}>Ir al inicio de sesión</Link>
            </Button>
          </div>
        ) : successMessage ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground" role="status">
              {successMessage}
            </p>
            <Button asChild className="w-full">
              <Link to={loginTo}>Ir al inicio de sesión</Link>
            </Button>
          </div>
        ) : (
          <>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FieldGroup>
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="password">Nueva contraseña</FieldLabel>
                      <Input
                        {...field}
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name="confirmPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="confirmPassword">Confirmar contraseña</FieldLabel>
                      <Input
                        {...field}
                        id="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </FieldGroup>
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando…' : 'Guardar contraseña'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {footer ?? (
                <>
                  <AuthFormLink to={loginHref}>Volver al inicio de sesión</AuthFormLink>
                </>
              )}
            </div>
          </>
        )}
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
