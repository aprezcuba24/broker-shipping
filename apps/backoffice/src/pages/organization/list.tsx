import type { Organization } from '@broker/api'
import { Button, DataTable, type ColumnDef } from '@broker/ui'
import { Pencil, Trash2 } from 'lucide-react'
import { useMemo } from 'react'

const PAGE_SIZE = 10

function buildColumns(
  onEdit: (org: Organization) => void,
  onDelete: (org: Organization) => void,
): ColumnDef<Organization>[] {
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Editar ${row.name}`}
            onClick={() => onEdit(row)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Eliminar ${row.name}`}
            onClick={() => onDelete(row)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]
}

export type OrganizationListProps = {
  organizations: Organization[]
  isLoading: boolean
  page: number
  onPageChange: (page: number) => void
  onEdit: (org: Organization) => void
  onDelete: (org: Organization) => void
}

export function OrganizationList({
  organizations,
  isLoading,
  page,
  onPageChange,
  onEdit,
  onDelete,
}: OrganizationListProps) {
  const columns = useMemo(
    () => buildColumns(onEdit, onDelete),
    [onEdit, onDelete],
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
