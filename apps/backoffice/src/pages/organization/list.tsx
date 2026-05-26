import type { Organization } from '@broker/api'
import { Button, DataTable, type ColumnDef } from '@broker/ui'
import { Pencil, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { DialogForm } from './DialogForm'
import type { OrganizationFormValues } from './use-organizations'

const PAGE_SIZE = 10

export type OrganizationListProps = {
  organizations: Organization[]
  isLoading: boolean
  page: number
  onPageChange: (page: number) => void
  onSubmitEdit: (
    org: Organization,
    values: OrganizationFormValues,
  ) => void | Promise<void>
  isSubmitting: boolean
  formError: string | null
  onEditClose: () => void
  onDelete: (org: Organization) => void
}

type OrganizationListActions = Pick<
  OrganizationListProps,
  'onSubmitEdit' | 'onEditClose' | 'isSubmitting' | 'formError' | 'onDelete'
>

function buildColumns(props: OrganizationListActions): ColumnDef<Organization>[] {
  return [
    { id: 'name', header: 'Nombre', accessor: 'name' },
    { id: 'created_at', header: 'Creado', accessor: 'created_at' },
    { id: 'updated_at', header: 'Actualizado', accessor: 'updated_at' },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <DialogForm
            icon={Pencil}
            label=""
            variant="ghost"
            size="icon"
            aria-label={`Editar ${row.name}`}
            title="Editar organización"
            acceptLabel="Guardar"
            defaultValues={{ name: row.name }}
            formKey={row.id}
            onSubmit={(values) => props.onSubmitEdit(row, values)}
            isSubmitting={props.isSubmitting}
            error={props.formError}
            onOpenChange={(open) => {
              if (!open) props.onEditClose()
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Eliminar ${row.name}`}
            onClick={() => props.onDelete(row)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]
}

export function OrganizationList(props: OrganizationListProps) {
  const { organizations, isLoading, page, onPageChange, ...actions } = props

  const columns = useMemo(
    () => buildColumns(actions),
    [actions],
  )

  const total = organizations.length
  const pageData = useMemo(
    () => organizations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [organizations, page],
  )

  return (
    <DataTable
      columns={columns}
      data={pageData}
      isLoading={isLoading}
      getRowId={(row) => row.id!}
      pagination={{
        page,
        pageSize: PAGE_SIZE,
        total,
        onPageChange,
      }}
      emptyMessage="No hay organizaciones registradas"
    />
  )
}
