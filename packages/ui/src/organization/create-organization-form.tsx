import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  AuthPageShell,
  type AuthPortalBranding,
} from '../components/auth/auth-page-shell'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '../components/ui/field'
import { Input } from '../components/ui/input'

const schema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(255),
})

export type CreateOrganizationFields = z.infer<typeof schema>

export type CreateOrganizationFormProps = {
  title?: string
  description?: string
  submitLabel?: string
  isSubmitting?: boolean
  error?: string | null
  embedded?: boolean
  portal?: AuthPortalBranding
  onSubmit: (values: CreateOrganizationFields) => void | Promise<void>
}

function OrganizationNameFields({
  form,
  isSubmitting,
  error,
  submitLabel,
}: {
  form: ReturnType<typeof useForm<CreateOrganizationFields>>
  isSubmitting: boolean
  error: string | null
  submitLabel: string
}) {
  return (
    <>
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="org-name">Nombre de la organización</FieldLabel>
              <Input
                {...field}
                id="org-name"
                type="text"
                autoComplete="organization"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
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
        {isSubmitting ? 'Creando…' : submitLabel}
      </Button>
    </>
  )
}

export function CreateOrganizationForm({
  title = 'Crea tu organización',
  description = 'Elige un nombre para tu organización. Podrás cambiarlo más adelante.',
  submitLabel = 'Continuar',
  isSubmitting = false,
  error = null,
  embedded = false,
  portal,
  onSubmit,
}: CreateOrganizationFormProps) {
  const form = useForm<CreateOrganizationFields>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  })

  const fields = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <OrganizationNameFields
        form={form}
        isSubmitting={isSubmitting}
        error={error}
        submitLabel={submitLabel}
      />
    </form>
  )

  if (embedded) {
    return fields
  }

  const card = (
    <Card className="w-full max-w-md border-border shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-headline">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{fields}</CardContent>
    </Card>
  )

  if (portal) {
    return <AuthPageShell {...portal}>{card}</AuthPageShell>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">{card}</div>
  )
}
