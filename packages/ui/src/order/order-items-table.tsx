import type { OrderItemPublic } from '@broker/api'
import { useMemo } from 'react'

import { DataTable } from '../components/data-table/data-table'
import type { ColumnDef } from '../components/data-table/types'

export type OrderItemsTableProps = {
  items: OrderItemPublic[]
  buildColumns: () => ColumnDef<OrderItemPublic>[]
}

export function OrderItemsTable({ items, buildColumns }: OrderItemsTableProps) {
  const columns = useMemo(() => buildColumns(), [buildColumns])

  return (
    <DataTable
      columns={columns}
      data={items}
      getRowId={(row) => row.id}
      pagination={{
        page: 1,
        total: items.length,
        onPageChange: () => {},
      }}
    />
  )
}
