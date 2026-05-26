import { Button, ConfirmDialog } from '@broker/ui'
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-2xl font-headline font-semibold text-foreground">
              Organizaciones
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Gestiona las organizaciones a las que tienes acceso.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nueva organización
        </Button>
      </div>

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
