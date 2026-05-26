import {
  Input,
  Label,
  useFormSubmitHandle,
  type FormModalFormProps,
} from '@broker/ui'
import { useForm } from 'react-hook-form'
import type { OrganizationFormValues } from './organizations-context'

export type OrganizationFormProps = FormModalFormProps<OrganizationFormValues>

export function OrganizationForm({
  ref,
  defaultValues = { name: '' },
  onSubmit,
  isSubmitting = false,
  error = null,
}: OrganizationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationFormValues>({
    defaultValues,
  })

  useFormSubmitHandle(ref, handleSubmit, onSubmit)

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="space-y-2">
        <Label htmlFor="organization-name">Nombre</Label>
        <Input
          id="organization-name"
          maxLength={255}
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

      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  )
}
