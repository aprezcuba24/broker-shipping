import type { OrderPublic, OrderStatus } from '@broker/api'
import {
  actionsColumn,
  Badge,
  BtnLink,
  BtnList,
  componentColumn,
  createdAtColumn,
  formatMoney,
  textColumn,
  type ColumnDef,
} from '@broker/ui'
import { Eye } from 'lucide-react'

const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  created: 'Creada',
  processing: 'En proceso',
  finished: 'Finalizada',
  canceled: 'Cancelada',
}

const ORDER_STATUS_VARIANT: Record<
  OrderStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  created: 'secondary',
  processing: 'default',
  finished: 'outline',
  canceled: 'destructive',
}

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABEL[status] ?? status
}

export function buildOrderColumns(): ColumnDef<OrderPublic>[] {
  return [
    textColumn<OrderPublic>({ id: 'code', header: 'Código', accessor: 'code' }),
    componentColumn<OrderPublic>('customer', 'Cliente', (row) => (
      <span>{row.customer?.name ?? '—'}</span>
    )),
    componentColumn<OrderPublic>('phone', 'Teléfono', (row) => (
      <span>{row.customer?.phone ?? '—'}</span>
    )),
    componentColumn<OrderPublic>('status', 'Estado', (row) => (
      <Badge variant={ORDER_STATUS_VARIANT[row.status]}>
        {orderStatusLabel(row.status)}
      </Badge>
    )),
    componentColumn<OrderPublic>('totals', 'Total', (row) => (
      <div className="space-y-0.5 tabular-nums text-sm">
        {(row.totals ?? []).length > 0
          ? (row.totals ?? []).map((total) => (
              <div key={total.currency}>
                {formatMoney(total.amount, total.currency)}
              </div>
            ))
          : '—'}
      </div>
    )),
    createdAtColumn<OrderPublic>({ header: 'Creada' }),
    actionsColumn<OrderPublic>((row) => (
      <BtnList>
        <BtnLink
          to={`/orders/${row.id}`}
          variant="ghost"
          size="sm"
          icon={Eye}
          aria-label={`Ver orden ${row.code}`}
        >
          Ver
        </BtnLink>
      </BtnList>
    )),
  ]
}
