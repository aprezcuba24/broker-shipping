import type { Organization } from '@broker/api'
import { BtnConfirm, BtnList, DataTable, type ColumnDef } from '@broker/ui'
import { Pencil, Trash2 } from 'lucide-react'
import { DialogForm } from './DialogForm'
import { useOrganizations } from './organizations-context'

function OrganizationRowActions({ organization }: { organization: Organization }) {
  const {
    submitEdit,
    clearFormError,
    isSubmitting,
    formError,
    deleteOrganization,
    isDeleting,
  } = useOrganizations()

  return (
    <BtnList>
      <DialogForm
        icon={Pencil}
        label=""
        variant="ghost"
        size="icon"
        aria-label={`Editar ${organization.name}`}
        title="Editar organización"
        acceptLabel="Guardar"
        defaultValues={{ name: organization.name }}
        formKey={organization.id}
        onSubmit={(values) => submitEdit(organization, values)}
        isSubmitting={isSubmitting}
        error={formError}
        onOpenChange={(open) => {
          if (!open) clearFormError()
        }}
      />
      <BtnConfirm
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Eliminar ${organization.name}`}
        title="Eliminar organización"
        description={`¿Seguro que deseas eliminar «${organization.name}»? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmVariant="destructive"
        onConfirm={() => deleteOrganization(organization)}
        isLoading={isDeleting}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </BtnConfirm>
    </BtnList>
  )
}

const columns: ColumnDef<Organization>[] = [
  { id: 'name', header: 'Nombre', accessor: 'name' },
  { id: 'created_at', header: 'Creado', accessor: 'created_at' },
  { id: 'updated_at', header: 'Actualizado', accessor: 'updated_at' },
  {
    id: 'actions',
    header: '',
    align: 'right',
    cell: (row) => <OrganizationRowActions organization={row} />,
  },
]

export function OrganizationList() {
  const { organizations, isLoading, page, setPage } = useOrganizations()

  return (
    <DataTable
      columns={columns}
      data={organizations}
      isLoading={isLoading}
      getRowId={(row) => row.id!}
      pagination={{ page, onPageChange: setPage }}
      emptyMessage="No hay organizaciones registradas"
    />
  )
}
