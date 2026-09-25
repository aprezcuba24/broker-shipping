import { zodResolver } from '@hookform/resolvers/zod'
import { PhoneBlacklistReason } from '@broker/api'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { FormFieldCell, FormSection } from '../components/form-section'
import { Field, FieldError, FieldLabel } from '../components/ui/field'
import { Input } from '../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import type { EntityFormProps } from '../crud/components/entity-form-dialog'
import { useFormSubmitHandle } from '../hooks/use-form-submit-handle'
import { PHONE_BLACKLIST_REASON_LABELS } from './phone-blacklist-labels'

export const phoneBlacklistFormSchema = z
  .object({
    phone: z
      .string()
      .trim()
      .min(1, 'El teléfono es obligatorio')
      .max(50, 'Máximo 50 caracteres'),
    reason: z.enum([
      PhoneBlacklistReason.nonpayment,
      PhoneBlacklistReason.fraud,
      PhoneBlacklistReason.abuse,
      PhoneBlacklistReason.other,
    ]),
    note: z.string().trim().max(500, 'Máximo 500 caracteres').optional(),
  })
  .superRefine((values, ctx) => {
    if (values.reason === PhoneBlacklistReason.other && !values.note?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['note'],
        message: 'La nota es obligatoria cuando el motivo es otro',
      })
    }
  })

export type PhoneBlacklistFormValues = z.infer<typeof phoneBlacklistFormSchema>

export const phoneBlacklistFormDefaultValues: PhoneBlacklistFormValues = {
  phone: '',
  reason: PhoneBlacklistReason.fraud,
  note: '',
}

export function PhoneBlacklistForm({
  ref,
  defaultValues = phoneBlacklistFormDefaultValues,
  onSubmit,
  isSubmitting = false,
  error = null,
}: EntityFormProps<PhoneBlacklistFormValues>) {
  const form = useForm<PhoneBlacklistFormValues>({
    resolver: zodResolver(phoneBlacklistFormSchema),
    defaultValues,
  })

  useFormSubmitHandle(ref, form.handleSubmit, onSubmit)
  const reason = useWatch({ control: form.control, name: 'reason' })

  return (
    <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
      <p className="text-sm text-muted-foreground">
        El número queda en tu lista. Otras organizaciones verán que la comunidad
        lo reporta.
      </p>
      <FormSection title="Teléfono">
        <FormFieldCell>
          <Controller
            name="phone"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="blacklist-phone">Número</FieldLabel>
                <Input
                  {...field}
                  id="blacklist-phone"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={50}
                  autoFocus
                  placeholder="Ej. 51234567"
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FormFieldCell>

        <FormFieldCell>
          <Controller
            name="reason"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="blacklist-reason">Motivo</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="blacklist-reason" aria-invalid={fieldState.invalid}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PHONE_BLACKLIST_REASON_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FormFieldCell>

        {reason === PhoneBlacklistReason.other ? (
          <FormFieldCell fullWidth>
            <Controller
              name="note"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="blacklist-note">Nota</FieldLabel>
                  <Input
                    {...field}
                    id="blacklist-note"
                    maxLength={500}
                    placeholder="Describe el motivo"
                    disabled={isSubmitting}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />
          </FormFieldCell>
        ) : null}
      </FormSection>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  )
}
