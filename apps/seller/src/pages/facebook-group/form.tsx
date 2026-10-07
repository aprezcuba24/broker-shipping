import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import {
  Field,
  FieldError,
  FieldLabel,
  FormFieldCell,
  FormSection,
  Input,
  useFormSubmitHandle,
  type EntityFormProps,
} from '@broker/ui'

export const facebookGroupFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  facebook_id: z
    .string()
    .trim()
    .min(1, 'El ID de Facebook es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
})

export type FacebookGroupFormValues = z.infer<typeof facebookGroupFormSchema>

export const facebookGroupFormDefaultValues: FacebookGroupFormValues = {
  name: '',
  facebook_id: '',
}

export function FacebookGroupForm({
  ref,
  defaultValues = facebookGroupFormDefaultValues,
  onSubmit,
  isSubmitting = false,
  error = null,
}: EntityFormProps<FacebookGroupFormValues>) {
  const form = useForm<FacebookGroupFormValues>({
    resolver: zodResolver(facebookGroupFormSchema),
    defaultValues,
  })

  useFormSubmitHandle(ref, form.handleSubmit, onSubmit)

  return (
    <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
      <FormSection title="Datos del grupo">
        <FormFieldCell fullWidth>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="facebook-group-name">Nombre</FieldLabel>
                <Input
                  {...field}
                  id="facebook-group-name"
                  maxLength={255}
                  autoFocus
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FormFieldCell>

        <FormFieldCell fullWidth>
          <Controller
            name="facebook_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="facebook-group-facebook-id">
                  ID de Facebook
                </FieldLabel>
                <Input
                  {...field}
                  id="facebook-group-facebook-id"
                  maxLength={255}
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FormFieldCell>
      </FormSection>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  )
}
