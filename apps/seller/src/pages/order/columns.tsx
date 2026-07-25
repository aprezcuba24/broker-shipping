import { type OrderDetail } from '@broker/api'
import { formatPriceCents, type ColumnDef } from '@broker/ui'
import { Link, useSearchParams } from 'react-router-dom'
import { formatOrderStatus, snapshotString } from './order-labels'

function OrderNameLink({ order }: { order: OrderDetail }) {
  const [searchParams] = useSearchParams()
  const search = searchParams.toString()
  const to = search ? `/orders/${order.id}?${search}` : `/orders/${order.id}`

  return (
    <Link to={to} className="font-medium text-primary hover:underline">
      {order.name}
    </Link>
  )
}

export const columns: ColumnDef<OrderDetail>[] = [
  {
    id: 'name',
    header: 'Código',
    cell: (row) => <OrderNameLink order={row} />,
  },
  {
    id: 'customer',
    header: 'Cliente',
    cell: (row) => snapshotString(row.customer_snapshot, 'name'),
  },
  {
    id: 'status',
    header: 'Estado',
    cell: (row) => formatOrderStatus(row.status),
  },
  {
    id: 'price',
    header: 'Total',
    cell: (row) => formatPriceCents(row.price),
  },
  {
    id: 'created_at',
    header: 'Creado',
    accessor: 'created_at',
    type: 'datetime',
  },
]
