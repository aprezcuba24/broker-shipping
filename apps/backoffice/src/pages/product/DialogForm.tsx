import {
  ButtonModal,
  EntitySelect,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  useFormSubmitHandle,
  type FormModalHandle,
  type FormModalProps,
} from '@broker/ui'
import { useListCategoriesProductsCategoriesGet } from '@broker/api'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { productFormSchema, type ProductFormValues } from './products-context'

export type DialogFormProps = Omit<
  FormModalProps<ProductFormValues>,
  'Form'
>

export function DialogForm({
  onSubmit,
  defaultValues = { name: '', category_id: '' },
  isSubmitting = false,
  error = null,
  formKey,
  open,
  onOpenChange,
  ...buttonProps
}: DialogFormProps) {
  const formRef = useRef<FormModalHandle>(null)
  const { data: categories = [] } = useListCategoriesProductsCategoriesGet()

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [formKey, defaultValues, form])

  useFormSubmitHandle(formRef, form.handleSubmit, onSubmit)

  const handleAccept = async () => {
    await formRef.current?.submit()
  }

  return (
    <ButtonModal
      onAccept={handleAccept}
      isLoading={isSubmitting}
      open={open}
      onOpenChange={onOpenChange}
      hideTrigger={open !== undefined}
      {...buttonProps}
    >
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
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name="category_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="product-category">Categoría</FieldLabel>
                <EntitySelect
                  items={categories}
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                  id="product-category"
                  placeholder="Selecciona una categoría"
                  triggerClassName="w-full"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                {categories.length === 0 && (
                  <FieldDescription>
                    Crea una categoría primero para poder asignarla al producto.
                  </FieldDescription>
                )}
              </Field>
            )}
          />
        </FieldGroup>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    </ButtonModal>
  )
}
