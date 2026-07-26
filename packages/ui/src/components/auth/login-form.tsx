import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import type { z } from 'zod'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '../ui/field'
import { Input } from '../ui/input'

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
}: LoginFormProps) {
  const form = useForm<LoginFields>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-headline">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
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
          {footer ? <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div> : null}
        </CardContent>
      </Card>
    </div>
  )
}

export function AuthFormLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="font-medium text-foreground underline-offset-4 hover:underline">
      {children}
    </Link>
  )
}
