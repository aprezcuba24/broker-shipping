import {
  ButtonModal,
  Input,
  Label,
  useFormSubmitHandle,
  type FormModalHandle,
  type FormModalProps,
} from '@broker/ui'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import type { OrganizationFormValues } from './organizations-context'

export type DialogFormProps = Omit<
  FormModalProps<OrganizationFormValues>,
  'Form'
>

export function DialogForm({
  onSubmit,
  defaultValues = { name: '' },
  isSubmitting = false,
  error = null,
  formKey,
  open,
  onOpenChange,
  ...buttonProps
}: DialogFormProps) {
  const formRef = useRef<FormModalHandle>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrganizationFormValues>({
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
      <form
        className="space-y-3"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="space-y-2">
          <Label htmlFor="organization-name">Nombre</Label>
          <Input
            id="organization-name"
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

        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    </ButtonModal>
  )
}
