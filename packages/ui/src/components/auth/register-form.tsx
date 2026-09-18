import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '../ui/field'
import { Input } from '../ui/input'
import { LinkedProviderCallout } from '../../organization/linked-provider-callout'
import { AuthPageShell, type AuthPortalBranding } from './auth-page-shell'
import { AuthFormLink } from './login-form'

export type RegisterFields = {
  name: string
  email: string
  password: string
}

export type RegisterFormProps = {
  title: string
  description: string
  schema: z.ZodObject<{
    name: z.ZodString
    email: z.ZodString
    password: z.ZodString
  }>
  onSubmit: (values: RegisterFields) => void | Promise<void>
  isSubmitting?: boolean
  error?: string | null
  successMessage?: string | null
  loginHref?: string
  footer?: ReactNode
  portal?: AuthPortalBranding
  /** When set, highlights the provider the seller will link to. */
  linkedProviderName?: string | null
}

export function RegisterForm({
  title,
  description,
  schema,
  onSubmit,
  isSubmitting = false,
  error = null,
  successMessage = null,
  loginHref = '/login',
  footer = null,
  portal,
  linkedProviderName = null,
}: RegisterFormProps) {
  const form = useForm<RegisterFields>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const isSuccess = Boolean(successMessage)

  const card = (
    <Card className="w-full max-w-md border-border shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-headline">
          {isSuccess ? 'Revisa tu correo' : title}
        </CardTitle>
        <CardDescription role={isSuccess ? 'status' : undefined}>
          {isSuccess ? successMessage : description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {linkedProviderName ? (
          <LinkedProviderCallout providerName={linkedProviderName} />
        ) : null}
        {isSuccess ? (
          <p className="text-center text-sm text-muted-foreground">
            <AuthFormLink to={loginHref}>Volver al inicio de sesión</AuthFormLink>
          </p>
        ) : (
          <>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="name">Nombre</FieldLabel>
                      <Input
                        {...field}
                        id="name"
                        type="text"
                        autoComplete="name"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
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
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="password">Contraseña</FieldLabel>
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
              </FieldGroup>
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
              </Button>
            </form>
            <div className="text-center text-sm text-muted-foreground">
              {footer ?? (
                <>
                  ¿Ya tienes cuenta? <AuthFormLink to={loginHref}>Inicia sesión</AuthFormLink>
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
