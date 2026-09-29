import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useListProvincesLocationsProvincesGet, type ProvincePublic } from '@broker/api'

import { EntitySelect } from '../../components/entity-select'
import { FormFieldCell, FormSection } from '../../components/form-section'
import { Field, FieldError, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import type { EntityFormProps } from '../../crud/components/entity-form-dialog'
import { useFormSubmitHandle } from '../../hooks/use-form-submit-handle'

export const municipalityFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  province_id: z.string().uuid('Selecciona una provincia'),
})

export type MunicipalityFormValues = z.infer<typeof municipalityFormSchema>

export const municipalityFormDefaultValues: MunicipalityFormValues = {
  name: '',
  province_id: '',
}

export function MunicipalityForm({
  ref,
  defaultValues = municipalityFormDefaultValues,
  onSubmit,
  isSubmitting = false,
  error = null,
}: EntityFormProps<MunicipalityFormValues>) {
  const form = useForm<MunicipalityFormValues>({
    resolver: zodResolver(municipalityFormSchema),
    defaultValues,
  })

  const provincesQuery = useListProvincesLocationsProvincesGet()
  const provinces = (provincesQuery.data ?? []) as ProvincePublic[]

  useFormSubmitHandle(ref, form.handleSubmit, onSubmit)

  return (
    <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
      <FormSection title="Datos del municipio">
        <FormFieldCell>
          <Controller
            name="province_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="municipality-province">Provincia</FieldLabel>
                <EntitySelect
                  id="municipality-province"
                  items={provinces}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Selecciona una provincia"
                  disabled={isSubmitting || provincesQuery.isLoading}
                  aria-invalid={fieldState.invalid}
                  aria-label="Provincia"
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FormFieldCell>

        <FormFieldCell>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="municipality-name">Nombre</FieldLabel>
                <Input
                  {...field}
                  id="municipality-name"
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
