import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ButtonModal,
  Input,
  Label,
  useFormSubmitHandle,
  type FormModalHandle,
  type FormModalProps,
} from '@broker/ui'
import { useListCategoriesProductsCategoriesGet } from '@broker/api'
import { useEffect, useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { ProductFormValues } from './products-context'

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

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues,
  })

  useEffect(() => {
    reset(defaultValues)
  }, [formKey, defaultValues, reset])

  useFormSubmitHandle(formRef, handleSubmit, onSubmit)

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
        <div className="space-y-2">
          <Label htmlFor="product-name">Nombre</Label>
          <Input
            id="product-name"
            maxLength={255}
            autoFocus
            disabled={isSubmitting}
            {...register('name', {
              required: 'El nombre es obligatorio',
              maxLength: { value: 255, message: 'Máximo 255 caracteres' },
            })}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-category">Categoría</Label>
          <Controller
            name="category_id"
            control={control}
            rules={{ required: 'La categoría es obligatoria' }}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting}
              >
                <SelectTrigger id="product-category" className="w-full">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent align="start">
                  {categories.map((category) => {
                    if (!category.id) return null
                    return (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category_id && (
            <p className="text-sm text-destructive">
              {errors.category_id.message}
            </p>
          )}
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Crea una categoría primero para poder asignarla al producto.
            </p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    </ButtonModal>
  )
}
