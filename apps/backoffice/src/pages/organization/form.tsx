import { Button, Input, Label } from '@broker/ui'
import { useForm } from 'react-hook-form'
import type { OrganizationFormValues } from './use-organizations'

export type OrganizationFormProps = {
  defaultValues?: OrganizationFormValues
  onSubmit: (values: OrganizationFormValues) => void
  isSubmitting?: boolean
  error?: string | null
  submitLabel: string
}

export function OrganizationForm({
  defaultValues = { name: '' },
  onSubmit,
  isSubmitting = false,
  error = null,
  submitLabel,
}: OrganizationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrganizationFormValues>({
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
