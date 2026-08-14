import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { Currency } from '@broker/api'

import {
  CURRENCY_OPTIONS,
  EntitySelect,
  Field,
  FieldError,
  FieldLabel,
  FormFieldCell,
  FormSection,
  ImageField,
  Input,
  MoneyInput,
  TagsField,
  imageFieldDefaultValue,
  imageFieldSchema,
  moneyCentsSchema,
  useFormSubmitHandle,
  type EntityFormProps,
  type TagOption,
} from '@broker/ui'

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  tag_ids: z.array(z.string().uuid()),
  price: moneyCentsSchema,
  commission: moneyCentsSchema,
  currency: z.enum([Currency.cup, Currency.usd]),
  image: imageFieldSchema,
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export const productFormDefaultValues: ProductFormValues = {
  name: '',
  tag_ids: [],
  price: 0,
  commission: 0,
  currency: Currency.cup,
  image: imageFieldDefaultValue,
}

export type ProductFormProps = EntityFormProps<ProductFormValues> & {
  initialTags?: TagOption[]
}

export function ProductForm({
  ref,
  defaultValues = productFormDefaultValues,
  onSubmit,
  isSubmitting = false,
  error = null,
  initialTags = [],
}: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  })

  useFormSubmitHandle(ref, form.handleSubmit, onSubmit)

  return (
    <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
      <FormSection title="Imagen">
        <FormFieldCell fullWidth>
          <Controller
            name="image"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="product-image">Imagen del producto</FieldLabel>
                <ImageField
                  id="product-image"
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                  alt="Imagen del producto"
                  size="xl"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FormFieldCell>
      </FormSection>

      <FormSection title="Datos del producto">
        <FormFieldCell>
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
        </FormFieldCell>

        <FormFieldCell>
          <Controller
            name="price"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="product-price">Precio</FieldLabel>
                <MoneyInput
                  id="product-price"
                  value={field.value}
                  onValueChange={field.onChange}
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
            name="commission"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="product-commission">Comisión</FieldLabel>
                <MoneyInput
                  id="product-commission"
                  value={field.value}
                  onValueChange={field.onChange}
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
            name="currency"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="product-currency">Moneda</FieldLabel>
                <EntitySelect
                  id="product-currency"
                  items={CURRENCY_OPTIONS}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Seleccionar moneda"
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                  triggerClassName="w-full"
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FormFieldCell>

        <FormFieldCell fullWidth>
          <Controller
            name="tag_ids"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="product-tags">Etiquetas</FieldLabel>
                <TagsField
                  id="product-tags"
                  value={field.value}
                  onValueChange={field.onChange}
                  initialTags={initialTags}
                  creatable
                  wrap
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                  placeholder="Añadir etiquetas…"
                  searchPlaceholder="Buscar o crear etiqueta…"
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
