import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { FormFieldCell, FormSection } from '../../components/form-section'
import { Field, FieldError, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import type { EntityFormProps } from '../../crud/components/entity-form-dialog'
import { useFormSubmitHandle } from '../../hooks/use-form-submit-handle'

export const provinceFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
})

export type ProvinceFormValues = z.infer<typeof provinceFormSchema>

export const provinceFormDefaultValues: ProvinceFormValues = {
  name: '',
}

export function ProvinceForm({
  ref,
  defaultValues = provinceFormDefaultValues,
  onSubmit,
  isSubmitting = false,
  error = null,
}: EntityFormProps<ProvinceFormValues>) {
  const form = useForm<ProvinceFormValues>({
    resolver: zodResolver(provinceFormSchema),
    defaultValues,
  })

  useFormSubmitHandle(ref, form.handleSubmit, onSubmit)

  return (
    <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
      <FormSection title="Datos de la provincia">
        <FormFieldCell>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="province-name">Nombre</FieldLabel>
                <Input
                  {...field}
                  id="province-name"
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
      </FormSection>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  )
}
