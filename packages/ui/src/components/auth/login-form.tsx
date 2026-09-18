import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import type { z } from 'zod'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '../ui/field'
import { Input } from '../ui/input'
import {
  LinkedProviderCallout,
  MEMBER_INVITE_CALLOUT_LABEL,
} from '../../organization/linked-provider-callout'
import { AuthPageShell, type AuthPortalBranding } from './auth-page-shell'

export type LoginFields = {
  email: string
  password: string
}

export type LoginFormProps = {
  title: string
  description: string
  schema: z.ZodObject<{
    email: z.ZodString
    password: z.ZodString
  }>
  onSubmit: (values: LoginFields) => void | Promise<void>
  isSubmitting?: boolean
  error?: string | null
  submitLabel?: string
  successMessage?: string | null
  footer?: ReactNode
  forgotPasswordHref?: string
  portal?: AuthPortalBranding
  /** When set, highlights the provider the seller will link to. */
  linkedProviderName?: string | null
  /** When set, highlights the org the user will join as a member (takes precedence). */
  memberInviteOrganizationName?: string | null
  /** Prefill email (e.g. from member invite). */
  defaultEmail?: string
  /** Lock email field when it must match the invitation. */
  emailReadOnly?: boolean
}

export function LoginForm({
  title,
  description,
  schema,
  onSubmit,
  isSubmitting = false,
  error = null,
  submitLabel = 'Entrar',
  successMessage = null,
  footer = null,
  forgotPasswordHref,
  portal,
  linkedProviderName = null,
  memberInviteOrganizationName = null,
  defaultEmail = '',
  emailReadOnly = false,
}: LoginFormProps) {
  const form = useForm<LoginFields>({
    resolver: zodResolver(schema),
    defaultValues: { email: defaultEmail, password: '' },
  })

  const calloutName = memberInviteOrganizationName ?? linkedProviderName
  const calloutLabel = memberInviteOrganizationName
    ? MEMBER_INVITE_CALLOUT_LABEL
    : undefined

  const card = (
    <Card className="w-full max-w-md border-border shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-headline">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {calloutName ? (
          <LinkedProviderCallout providerName={calloutName} label={calloutLabel} />
        ) : null}
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
                    readOnly={emailReadOnly}
                    aria-invalid={fieldState.invalid}
                    className={emailReadOnly ? 'bg-muted' : undefined}
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
                  <div className="flex items-center justify-between gap-3">
                    <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                    {forgotPasswordHref ? (
                      <Link
                        to={forgotPasswordHref}
                        className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline hover:text-foreground shrink-0"
                      >
                        ¿Olvidaste tu contraseña?
                      </Link>
                    ) : null}
                  </div>
                  <Input
                    {...field}
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
          {successMessage ? (
            <p className="text-sm text-muted-foreground" role="status">
              {successMessage}
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando…' : submitLabel}
          </Button>
        </form>
        {footer ? <div className="text-center text-sm text-muted-foreground">{footer}</div> : null}
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

export function AuthFormLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="font-medium text-foreground underline-offset-4 hover:underline">
      {children}
    </Link>
  )
}
