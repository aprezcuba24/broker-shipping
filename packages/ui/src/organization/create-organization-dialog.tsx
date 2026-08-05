import { OrganizationType } from '@broker/api'
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { CreateOrganizationForm } from './create-organization-form'
import { useCreateOrganization } from './use-create-organization'

export type CreateOrganizationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
}: CreateOrganizationDialogProps) {
  const { organizationType, isSubmitting, error, onCreate } = useCreateOrganization()
  const [formKey, setFormKey] = useState(0)

  useEffect(() => {
    if (open) setFormKey((k) => k + 1)
  }, [open])

  const description =
    organizationType === OrganizationType.seller
      ? 'Crea otra organización vendedora.'
      : 'Crea otra organización proveedora.'

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isSubmitting) return
    onOpenChange(nextOpen)
  }

  const handleSubmit = async (values: { name: string }) => {
    await onCreate(values)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="broker-dialog sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Nueva organización</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <CreateOrganizationForm
          key={formKey}
          embedded
          submitLabel="Crear"
          isSubmitting={isSubmitting}
          error={error}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  )
}
