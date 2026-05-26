import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@broker/ui'
import { OrganizationForm } from './form'
import type { OrganizationFormValues } from './use-organizations'

export type OrganizationFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  organizationId?: string
  defaultValues: OrganizationFormValues
  onSubmit: (values: OrganizationFormValues) => void
  isSubmitting?: boolean
  error?: string | null
}

export function OrganizationFormModal({
  open,
  onOpenChange,
  mode,
  organizationId,
  defaultValues,
  onSubmit,
  isSubmitting = false,
  error = null,
}: OrganizationFormModalProps) {
  const title = mode === 'create' ? 'Nueva organización' : 'Editar organización'
  const submitLabel = mode === 'create' ? 'Crear' : 'Guardar'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <OrganizationForm
          key={`${mode}-${organizationId ?? 'new'}`}
          defaultValues={defaultValues}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          error={error}
          submitLabel={submitLabel}
        />
      </DialogContent>
    </Dialog>
  )
}
