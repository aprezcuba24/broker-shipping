import { useRef } from 'react'

import { ButtonModal, type ButtonModalProps } from '../../components/button-modal'

export type EntityFormHandle = {
  submit: () => Promise<void>
}

export type EntityFormProps<TValues> = {
  ref?: React.Ref<EntityFormHandle>
  defaultValues?: TValues
  onSubmit: (values: TValues) => unknown | Promise<unknown>
  isSubmitting?: boolean
  error?: string | null
}

export type EntityFormDialogProps<TValues> = {
  Form: React.ComponentType<EntityFormProps<TValues>>
  onSubmit: (values: TValues) => unknown | Promise<unknown>
  defaultValues?: TValues
  isSubmitting?: boolean
  error?: string | null
  formKey?: string | number
  open?: boolean
  onOpenChange?: (open: boolean) => void
} & Omit<
  ButtonModalProps,
  'onAccept' | 'onCancel' | 'onSubmit' | 'isLoading' | 'open' | 'onOpenChange' | 'children'
>

export function EntityFormDialog<TValues>({
  Form,
  onSubmit,
  defaultValues,
  isSubmitting = false,
  error = null,
  formKey,
  open,
  onOpenChange,
  ...buttonProps
}: EntityFormDialogProps<TValues>) {
  const formRef = useRef<EntityFormHandle>(null)

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
