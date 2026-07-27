import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '../components/ui/field'
import { Input } from '../components/ui/input'

const schema = z.object({
  provider_organization_id: z.string().uuid('ID de organización inválido'),
})

export type ProviderLinkRequestFields = z.infer<typeof schema>

export type ProviderLinkRequestFormProps = {
  isSubmitting?: boolean
  error?: string | null
  successMessage?: string | null
  onSubmit: (values: ProviderLinkRequestFields) => void | Promise<void>
}

export function ProviderLinkRequestForm({
  isSubmitting = false,
  error = null,
  successMessage = null,
  onSubmit,
}: ProviderLinkRequestFormProps) {
  const form = useForm<ProviderLinkRequestFields>({
    resolver: zodResolver(schema),
    defaultValues: { provider_organization_id: '' },
  })

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values)
        form.reset()
      })}
      className="space-y-4"
    >
      <FieldGroup>
        <Controller
          name="provider_organization_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="provider-org-id">ID de organización proveedora</FieldLabel>
              <Input
                {...field}
                id="provider-org-id"
                type="text"
                placeholder="uuid del proveedor"
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
      {successMessage ? (
        <p className="text-sm text-muted-foreground" role="status">
          {successMessage}
        </p>
      ) : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando…' : 'Solicitar enlace'}
      </Button>
    </form>
  )
}
