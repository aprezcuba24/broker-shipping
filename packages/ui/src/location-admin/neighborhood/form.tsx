import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  useListMunicipalitiesLocationsProvincesProvinceIdMunicipalitiesGet,
  useListProvincesLocationsProvincesGet,
  type MunicipalityPublic,
  type ProvincePublic,
} from '@broker/api'

import { EntitySelect } from '../../components/entity-select'
import { FormFieldCell, FormSection } from '../../components/form-section'
import { Field, FieldError, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import type { EntityFormProps } from '../../crud/components/entity-form-dialog'
import { useFormSubmitHandle } from '../../hooks/use-form-submit-handle'

export const neighborhoodFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  province_id: z.string().uuid('Selecciona una provincia'),
  municipality_id: z.string().uuid('Selecciona un municipio'),
})

export type NeighborhoodFormValues = z.infer<typeof neighborhoodFormSchema>

export const neighborhoodFormDefaultValues: NeighborhoodFormValues = {
  name: '',
  province_id: '',
  municipality_id: '',
}

export function NeighborhoodForm({
  ref,
  defaultValues = neighborhoodFormDefaultValues,
  onSubmit,
  isSubmitting = false,
  error = null,
}: EntityFormProps<NeighborhoodFormValues>) {
  const form = useForm<NeighborhoodFormValues>({
    resolver: zodResolver(neighborhoodFormSchema),
    defaultValues,
  })

  const provinceId = useWatch({ control: form.control, name: 'province_id' })

  const provincesQuery = useListProvincesLocationsProvincesGet()
  const provinces = (provincesQuery.data ?? []) as ProvincePublic[]

  const municipalitiesQuery = useListMunicipalitiesLocationsProvincesProvinceIdMunicipalitiesGet(
    provinceId,
    undefined,
    { query: { enabled: Boolean(provinceId) } },
  )
  const municipalities = (municipalitiesQuery.data ?? []) as MunicipalityPublic[]

  useFormSubmitHandle(ref, form.handleSubmit, onSubmit)

  return (
    <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
      <FormSection title="Datos del barrio">
        <FormFieldCell>
          <Controller
            name="province_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="neighborhood-province">Provincia</FieldLabel>
                <EntitySelect
                  id="neighborhood-province"
                  items={provinces}
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                    form.setValue('municipality_id', '')
                  }}
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
            name="municipality_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="neighborhood-municipality">Municipio</FieldLabel>
                <EntitySelect
                  id="neighborhood-municipality"
                  items={municipalities}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={
                    provinceId ? 'Selecciona un municipio' : 'Selecciona una provincia primero'
                  }
                  disabled={isSubmitting || !provinceId || municipalitiesQuery.isLoading}
                  aria-invalid={fieldState.invalid}
                  aria-label="Municipio"
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
                <FieldLabel htmlFor="neighborhood-name">Nombre</FieldLabel>
                <Input
                  {...field}
                  id="neighborhood-name"
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
