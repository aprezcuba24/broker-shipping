import { Button, ConfirmDialog, HeaderPage } from '@broker/ui'
import { Building2, Plus } from 'lucide-react'
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
    modalMode,
    editingOrg,
    deleteTarget,
    formError,
    isSubmitting,
    isDeleting,
    openCreate,
    openEdit,
    closeModal,
    submitForm,
    requestDelete,
    cancelDelete,
    confirmDelete,
  } = useOrganizations()

  const formDefaults = {
    name: modalMode === 'edit' && editingOrg ? editingOrg.name : '',
  }

  return (
    <div className="space-y-6">
      <HeaderPage
        title="Organizaciones"
        description="Gestiona las organizaciones a las que tienes acceso."
        icon={Building2}
      >
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nueva organización
        </Button>
      </HeaderPage>

      <OrganizationList
        organizations={organizations}
        isLoading={isLoading}
        page={page}
        onPageChange={setPage}
        onEdit={openEdit}
        onDelete={requestDelete}
      />

      <OrganizationFormModal
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) closeModal()
        }}
        mode={modalMode}
        organizationId={editingOrg?.id}
        defaultValues={formDefaults}
        onSubmit={submitForm}
        isSubmitting={isSubmitting}
        error={formError}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) cancelDelete()
        }}
        title="Eliminar organización"
        description={
          deleteTarget
            ? `¿Seguro que deseas eliminar «${deleteTarget.name}»? Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}
