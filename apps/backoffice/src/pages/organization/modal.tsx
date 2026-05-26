import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@broker/ui'
import { useRef } from 'react'
import { OrganizationForm, type OrganizationFormHandle } from './form'
import type { OrganizationFormValues } from './use-organizations'

export type OrganizationFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'edit'
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
  const formRef = useRef<OrganizationFormHandle>(null)

  const handleSave = () => {
    void formRef.current?.submit()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar organización</DialogTitle>
        </DialogHeader>
        <OrganizationForm
          ref={formRef}
          key={`${mode}-${organizationId ?? 'new'}`}
          defaultValues={defaultValues}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          error={error}
        />
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Procesando…' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
