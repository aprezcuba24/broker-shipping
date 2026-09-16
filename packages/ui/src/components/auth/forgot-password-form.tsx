import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '../ui/field'
import { Input } from '../ui/input'
import { AuthPageShell, type AuthPortalBranding } from './auth-page-shell'
import { AuthFormLink } from './login-form'

export type ForgotPasswordFields = {
  email: string
}

export type ForgotPasswordFormProps = {
  title?: string
  description?: string
  schema: z.ZodObject<{
    email: z.ZodString
  }>
  onSubmit: (values: ForgotPasswordFields) => void | Promise<void>
  isSubmitting?: boolean
  error?: string | null
  successMessage?: string | null
  loginHref?: string
  footer?: ReactNode
  portal?: AuthPortalBranding
}

export function ForgotPasswordForm({
  title = 'Recuperar contraseña',
  description = 'Introduce el correo de tu cuenta. Si existe, te enviaremos un enlace para elegir una nueva contraseña.',
  schema,
  onSubmit,
  isSubmitting = false,
  error = null,
  successMessage = null,
  loginHref = '/login',
  footer = null,
  portal,
}: ForgotPasswordFormProps) {
  const form = useForm<ForgotPasswordFields>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  const card = (
    <Card className="w-full max-w-md border-border shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-headline">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {successMessage ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground" role="status">
              {successMessage}
            </p>
            <p className="text-center text-sm text-muted-foreground">
              <AuthFormLink to={loginHref}>Volver al inicio de sesión</AuthFormLink>
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FieldGroup>
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="email">Correo</FieldLabel>
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        autoComplete="email"
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
                {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {footer ?? (
                <>
                  ¿La recuerdas? <AuthFormLink to={loginHref}>Inicia sesión</AuthFormLink>
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
