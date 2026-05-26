import { ConfirmDialog, HeaderPage } from '@broker/ui'
import { Building2, Plus } from 'lucide-react'
import { DialogForm } from './DialogForm'
import { OrganizationList } from './list'
import { OrganizationFormModal } from './modal'
import { useOrganizations } from './use-organizations'

export function OrganizationPage() {
  const {
    organizations,
    isLoading,
    page,
    setPage,
    modalOpen,
    editingOrg,
    deleteTarget,
    formError,
    createFormKey,
    isCreating,
    isSubmitting,
    isDeleting,
    openEdit,
    closeModal,
    submitCreate,
    resetCreateForm,
    submitForm,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = useOrganizations()

  const formDefaults = {
    name: editingOrg?.name ?? '',
  }

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
        onEdit={openEdit}
        onDelete={requestDelete}
      />

      {modalOpen && editingOrg && (
        <OrganizationFormModal
          open={modalOpen}
          onOpenChange={(open) => {
            if (!open) closeModal()
          }}
          mode="edit"
          organizationId={editingOrg.id}
          defaultValues={formDefaults}
          onSubmit={submitForm}
          isSubmitting={isSubmitting}
          error={formError}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) cancelDelete()
        }}
        title="Eliminar organización"
        description={`¿Seguro que deseas eliminar «${deleteTarget?.name}»? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
