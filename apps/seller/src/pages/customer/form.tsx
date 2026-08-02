import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  ProvinceMunicipalityFields,
  Textarea,
  useFormSubmitHandle,
  type EntityFormProps,
} from '@broker/ui'

export const customerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  ci: z
    .string()
    .trim()
    .min(1, 'El CI es obligatorio')
    .max(50, 'Máximo 50 caracteres'),
  phone: z
    .string()
    .trim()
    .min(1, 'El teléfono es obligatorio')
    .max(50, 'Máximo 50 caracteres'),
  address: z
    .string()
    .trim()
    .min(1, 'La dirección es obligatoria')
    .max(500, 'Máximo 500 caracteres'),
  province_id: z.string().uuid('Selecciona una provincia'),
  municipality_id: z.string().uuid('Selecciona un municipio'),
})

export type CustomerFormValues = z.infer<typeof customerFormSchema>

export const customerFormDefaultValues: CustomerFormValues = {
  name: '',
  ci: '',
  phone: '',
  address: '',
  province_id: '',
  municipality_id: '',
}

export function CustomerForm({
  ref,
  defaultValues = customerFormDefaultValues,
  onSubmit,
  isSubmitting = false,
  error = null,
}: EntityFormProps<CustomerFormValues>) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues,
  })

  useFormSubmitHandle(ref, form.handleSubmit, onSubmit)

  return (
    <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="customer-name">Nombre</FieldLabel>
              <Input
                {...field}
                id="customer-name"
                maxLength={255}
                autoFocus
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        <Controller
          name="ci"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="customer-ci">CI</FieldLabel>
              <Input
                {...field}
                id="customer-ci"
                maxLength={50}
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        <Controller
          name="phone"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="customer-phone">Teléfono</FieldLabel>
              <Input
                {...field}
                id="customer-phone"
                maxLength={50}
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        <Controller
          name="address"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="customer-address">Dirección</FieldLabel>
              <Textarea
                {...field}
                id="customer-address"
                maxLength={500}
                rows={2}
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        <ProvinceMunicipalityFields
          control={form.control}
          setValue={form.setValue}
          provinceName="province_id"
          municipalityName="municipality_id"
          disabled={isSubmitting}
        />
      </FieldGroup>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  )
}
