import { HeaderPage } from '@broker/ui'
import { Building2, Plus } from 'lucide-react'
import { DialogForm } from './DialogForm'
import { OrganizationList } from './list'
import {
  OrganizationsProvider,
  useOrganizations,
} from './organizations-context'

export function OrganizationPage() {
  return (
    <OrganizationsProvider>
      <OrganizationPageContent />
    </OrganizationsProvider>
  )
}

function OrganizationPageContent() {
  const {
    formError,
    createFormKey,
    isCreating,
    submitCreate,
    resetCreateForm,
  } = useOrganizations()

  return (
    <div className="space-y-6">
      <HeaderPage
        title="Organizaciones"
        description="Gestiona las organizaciones a las que tienes acceso."
        icon={Building2}
      >
        <DialogForm
          label="Nueva organización"
          icon={Plus}
          title="Nueva organización"
          acceptLabel="Crear"
          defaultValues={{ name: '' }}
          formKey={String(createFormKey)}
          onSubmit={submitCreate}
          isSubmitting={isCreating}
          error={formError}
          onOpenChange={(open) => {
            if (!open) resetCreateForm()
          }}
        />
      </HeaderPage>

      <OrganizationList />
    </div>
  )
}
