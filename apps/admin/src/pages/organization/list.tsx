import { DataTable, HeaderPage, type ColumnDef } from '@broker/ui'
import { useMemo, useState } from 'react'

import {
  mockOrganizations,
  type Organization,
} from '../../mocks/organizations'

export function OrganizationListPage() {
  const [page, setPage] = useState(1)

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
        data={mockOrganizations}
        pagination={{
          page,
          onPageChange: setPage,
        }}
        emptyMessage="No hay organizaciones registradas"
      />
    </div>
  )
}
