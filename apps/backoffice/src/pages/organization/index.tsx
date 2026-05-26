import { HeaderPage } from '@broker/ui'
import { Building2, Plus } from 'lucide-react'
import { DialogForm } from './DialogForm'
import { OrganizationList } from './list'
import { useOrganizations } from './use-organizations'

export function OrganizationPage() {
  const {
    organizations,
    isLoading,
    page,
    setPage,
    formError,
    createFormKey,
    isCreating,
    isSubmitting,
    isDeleting,
    submitCreate,
    resetCreateForm,
    submitEdit,
    clearFormError,
    deleteOrganization,
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

      <OrganizationList
        organizations={organizations}
        isLoading={isLoading}
        page={page}
        onPageChange={setPage}
        onSubmitEdit={submitEdit}
        isSubmitting={isSubmitting}
        formError={formError}
        onEditClose={clearFormError}
        onDelete={deleteOrganization}
        isDeleting={isDeleting}
      />
    </div>
  )
}
