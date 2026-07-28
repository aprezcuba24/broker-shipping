import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '../components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '../components/ui/field'
import { Input } from '../components/ui/input'

const schema = z.object({
  invitee_email: z.string().email('Correo inválido'),
})

export type MemberInviteFields = z.infer<typeof schema>

export type MemberInviteFormProps = {
  isSubmitting?: boolean
  error?: string | null
  successMessage?: string | null
  onSubmit: (values: MemberInviteFields) => void | Promise<void>
}

export function MemberInviteForm({
  isSubmitting = false,
  error = null,
  successMessage = null,
  onSubmit,
}: MemberInviteFormProps) {
  const form = useForm<MemberInviteFields>({
    resolver: zodResolver(schema),
    defaultValues: { invitee_email: '' },
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
          name="invitee_email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="invitee-email">Correo del miembro</FieldLabel>
              <Input
                {...field}
                id="invitee-email"
                type="email"
                autoComplete="email"
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
        {isSubmitting ? 'Enviando…' : 'Enviar invitación'}
      </Button>
    </form>
  )
}
