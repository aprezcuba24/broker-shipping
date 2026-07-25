import { type OrderLineDetail } from '@broker/api'
import { DataTable, formatPriceCents, type ColumnDef } from '@broker/ui'
import { formatOrderLineStatus } from '../order-labels'

function productSnapshotName(snapshot: OrderLineDetail['product_snapshot']): string {
  const name = snapshot.name
  if (typeof name === 'string' && name) return name
  return '—'
}

const lineColumns: ColumnDef<OrderLineDetail>[] = [
  {
    id: 'product',
    header: 'Producto',
    cell: (row) => productSnapshotName(row.product_snapshot),
  },
  {
    id: 'provider',
    header: 'Proveedor',
    cell: (row) => row.organization.name,
  },
  {
    id: 'quantity',
    header: 'Cantidad',
    accessor: 'quantity',
  },
  {
    id: 'product_price',
    header: 'Precio unit.',
    cell: (row) => formatPriceCents(row.product_price),
  },
  {
    id: 'price',
    header: 'Subtotal',
    cell: (row) => formatPriceCents(row.price),
  },
  {
    id: 'status',
    header: 'Estado',
    cell: (row) => formatOrderLineStatus(row.status),
  },
]

export function OrderLines({ lines }: { lines: OrderLineDetail[] }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-foreground">Líneas</h2>
      <DataTable
        columns={lineColumns}
        data={lines}
        getRowId={(row) => row.id}
        emptyMessage="Esta orden no tiene líneas"
      />
    </section>
  )
}
