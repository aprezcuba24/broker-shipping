import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '../components/ui/field'
import { Input } from '../components/ui/input'

const schema = z.object({
  invitee_email: z.string().email('Correo inválido'),
  counterparty_organization_id: z.string().uuid().optional().or(z.literal('')),
})

export type SellerOrgLinkInviteFields = {
  invitee_email: string
  counterparty_organization_id?: string
}

export type SellerOrgLinkInviteFormProps = {
  isSubmitting?: boolean
  error?: string | null
  successMessage?: string | null
  onSubmit: (values: SellerOrgLinkInviteFields) => void | Promise<void>
}

export function SellerOrgLinkInviteForm({
  isSubmitting = false,
  error = null,
  successMessage = null,
  onSubmit,
}: SellerOrgLinkInviteFormProps) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { invitee_email: '', counterparty_organization_id: '' },
  })

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit({
          invitee_email: values.invitee_email,
          counterparty_organization_id: values.counterparty_organization_id || undefined,
        })
        form.reset()
      })}
      className="space-y-4"
    >
      <FieldGroup>
        <Controller
          name="invitee_email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="seller-invite-email">Correo de contacto</FieldLabel>
              <Input
                {...field}
                id="seller-invite-email"
                type="email"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
        <Controller
          name="counterparty_organization_id"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="seller-org-id">
                ID de organización vendedora (opcional)
              </FieldLabel>
              <Input
                {...field}
                id="seller-org-id"
                type="text"
                placeholder="uuid de la org vendedora"
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
        {isSubmitting ? 'Enviando…' : 'Invitar organización vendedora'}
      </Button>
    </form>
  )
}
