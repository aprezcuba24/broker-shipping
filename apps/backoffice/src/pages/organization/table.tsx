import { DataTable, PageWrapper } from "@broker/ui"
import { Building2, Plus } from "lucide-react"
import { DialogForm } from "./DialogForm"
import { columns } from "./columns"
import { useOrganizations } from "./organizations-context"

export function OrganizationTable() {
  const {
    formError,
    createFormKey,
    isCreating,
    submitCreate,
    resetCreateForm,
    organizations,
    isLoading,
    page,
    setPage,
  } = useOrganizations()

  return (
    <PageWrapper
      title="Organizaciones"
      description="Gestiona las organizaciones a las que tienes acceso."
      icon={Building2}
      buttons={[
        <DialogForm
          key="create"
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
        />,
      ]}
    >
      <DataTable
        columns={columns}
        data={organizations}
        isLoading={isLoading}
        getRowId={(row) => row.id!}
        pagination={{ page, onPageChange: setPage }}
        emptyMessage="No hay organizaciones registradas"
      />
    </PageWrapper>
  )
}