import type { Organization } from '@broker/api'
import { BtnConfirm, BtnList, type ColumnDef } from '@broker/ui'
import { Pencil, Trash2 } from 'lucide-react'
import { DialogForm } from './DialogForm'
import { useOrganizations } from './organizations-context'

function RowActions({ organization }: { organization: Organization }) {
  const {
    submitEdit,
    clearFormError,
    isSubmitting,
    formError,
    deleteItem,
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
        onConfirm={() => deleteItem(organization)}
        isLoading={isDeleting}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </BtnConfirm>
    </BtnList>
  )
}

export const columns: ColumnDef<Organization>[] = [
  { id: 'name', header: 'Nombre', accessor: 'name' },
  { id: 'created_at', header: 'Creado', accessor: 'created_at' },
  { id: 'updated_at', header: 'Actualizado', accessor: 'updated_at' },
  {
    id: 'actions',
    header: '',
    align: 'right',
    cell: (row) => <RowActions organization={row} />,
  },
]
