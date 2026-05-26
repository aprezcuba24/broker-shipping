import { useRef } from 'react'

import { ButtonModal, type ButtonModalProps } from './button-modal'

export type FormModalHandle = {
  submit: () => Promise<void>
}

export type FormModalFormProps<TValues> = {
  ref?: React.Ref<FormModalHandle>
  defaultValues?: TValues
  onSubmit: (values: TValues) => void | Promise<void>
  isSubmitting?: boolean
  error?: string | null
}

export type FormModalProps<TValues> = {
  Form: React.ComponentType<FormModalFormProps<TValues>>
  onSubmit: (values: TValues) => void | Promise<void>
  defaultValues?: TValues
  isSubmitting?: boolean
  error?: string | null
  formKey?: string | number
  open?: boolean
  onOpenChange?: (open: boolean) => void
} & Omit<
  ButtonModalProps,
  | 'onAccept'
  | 'onCancel'
  | 'onSubmit'
  | 'isLoading'
  | 'open'
  | 'onOpenChange'
  | 'children'
>

export function FormModal<TValues>({
  Form,
  onSubmit,
  defaultValues,
  isSubmitting = false,
  error = null,
  formKey,
  open,
  onOpenChange,
  ...buttonProps
}: FormModalProps<TValues>) {
  const formRef = useRef<FormModalHandle>(null)

  const handleAccept = async () => {
    await formRef.current?.submit()
  }

  return (
    <ButtonModal
      onAccept={handleAccept}
      isLoading={isSubmitting}
      open={open}
      onOpenChange={onOpenChange}
      {...buttonProps}
    >
      <Form
        ref={formRef}
        key={formKey}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        error={error}
      />
    </ButtonModal>
  )
}
