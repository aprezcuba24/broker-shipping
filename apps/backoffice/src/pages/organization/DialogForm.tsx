import { ButtonModal, type ButtonModalProps } from '@broker/ui'
import { useRef } from 'react'
import {
  OrganizationForm,
  type OrganizationFormHandle,
} from './form'
import type { OrganizationFormValues } from './organizations-context'

export type DialogFormProps = {
  onSubmit: (values: OrganizationFormValues) => void | Promise<void>
  defaultValues?: OrganizationFormValues
  isSubmitting?: boolean
  error?: string | null
  formKey?: string
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

export function DialogForm({
  onSubmit,
  defaultValues,
  isSubmitting = false,
  error = null,
  formKey,
  open,
  onOpenChange,
  ...buttonProps
}: DialogFormProps) {
  const formRef = useRef<OrganizationFormHandle>(null)

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
      <OrganizationForm
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
