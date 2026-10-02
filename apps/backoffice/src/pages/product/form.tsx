import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import {
  CommissionField,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FormFieldCell,
  FormSection,
  ImageField,
  Input,
  MoneyField,
  TagsField,
  Textarea,
  imageFieldDefaultValue,
  imageFieldSchema,
  moneyDefault,
  moneySchema,
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
  description: z.string().trim().max(2000, 'Máximo 2000 caracteres'),
  notes: z.string().trim().max(2000, 'Máximo 2000 caracteres'),
  has_commission: z.boolean(),
  tag_ids: z.array(z.string().uuid()),
  price: moneySchema,
  commission: moneySchema,
  image: imageFieldSchema,
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export const productFormDefaultValues: ProductFormValues = {
  name: '',
  description: '',
  notes: '',
  has_commission: true,
  tag_ids: [],
  price: moneyDefault(),
  commission: moneyDefault(),
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
        <FormFieldCell fullWidth>
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
                <MoneyField
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
            name="has_commission"
            control={form.control}
            render={({ field: hasCommissionField }) => (
              <Controller
                name="commission"
                control={form.control}
                render={({ field: commissionField, fieldState }) => (
                  <>
                    <CommissionField
                      id="product-commission"
                      hasCommission={hasCommissionField.value}
                      onHasCommissionChange={hasCommissionField.onChange}
                      commission={commissionField.value}
                      onCommissionChange={commissionField.onChange}
                      disabled={isSubmitting}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : null}
                  </>
                )}
              />
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

        <FormFieldCell fullWidth>
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="product-description">Descripción</FieldLabel>
                <Textarea
                  {...field}
                  id="product-description"
                  maxLength={2000}
                  rows={4}
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                  placeholder="Descripción opcional del producto…"
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FormFieldCell>

        <FormFieldCell fullWidth>
          <Controller
            name="notes"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="product-notes">Notas</FieldLabel>
                <Textarea
                  {...field}
                  id="product-notes"
                  maxLength={2000}
                  rows={4}
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                  placeholder="Notas internas del producto…"
                />
                <FieldDescription className="text-xs">
                  Solo visible para proveedores
                </FieldDescription>
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
