import { DataTable, HeaderPage, type ColumnDef } from '@broker/ui'
import { useMemo, useState } from 'react'

import {
  mockOrganizations,
  type Organization,
} from '../../mocks/organizations'

const PAGE_SIZE = 10

export function OrganizationListPage() {
  const [page, setPage] = useState(1)

  const total = mockOrganizations.length
  const pageData = useMemo(
    () =>
      mockOrganizations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page]
  )

  const columns = useMemo<ColumnDef<Organization>[]>(
    () => [
      { id: 'name', header: 'Nombre', accessor: 'name' },
      { id: 'created_at', header: 'Creado', accessor: 'created_at' },
      { id: 'updated_at', header: 'Actualizado', accessor: 'updated_at' },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <HeaderPage
        title="Organizaciones"
        description="Gestiona las organizaciones registradas en la plataforma."
      />

      <DataTable
        columns={columns}
        data={pageData}
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total,
          onPageChange: setPage,
        }}
        emptyMessage="No hay organizaciones registradas"
      />
    </div>
  )
}
