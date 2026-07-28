import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  useFormSubmitHandle,
  type EntityFormProps,
} from '@broker/ui'

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export const productFormDefaultValues: ProductFormValues = {
  name: '',
}

export function ProductForm({
  ref,
  defaultValues = productFormDefaultValues,
  onSubmit,
  isSubmitting = false,
  error = null,
}: EntityFormProps<ProductFormValues>) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
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
              <FieldLabel htmlFor="product-name">Nombre</FieldLabel>
              <Input
                {...field}
                id="product-name"
                maxLength={255}
                autoFocus
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  )
}
