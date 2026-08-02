import type { OrderPublic } from '@broker/api'
import { Eye } from 'lucide-react'

import { BtnLink } from '../components/btn-link'
import { BtnList } from '../components/btn-list'
import type { ColumnDef } from '../components/data-table/types'
import {
  actionsColumn,
  componentColumn,
  createdAtColumn,
  textColumn,
} from '../crud/components/columns'
import { formatMoney } from '../lib/utils'
import { OrderStatusBadge } from './status'

function buildSharedOrderColumns(): ColumnDef<OrderPublic>[] {
  return [
    textColumn<OrderPublic>({ id: 'code', header: 'Código', accessor: 'code' }),
    componentColumn<OrderPublic>('status', 'Estado', (row) => (
      <OrderStatusBadge status={row.status} />
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

export function buildSellerOrderColumns(): ColumnDef<OrderPublic>[] {
  const [code, status, totals, created, actions] = buildSharedOrderColumns()
  return [
    code,
    componentColumn<OrderPublic>('customer', 'Cliente', (row) => (
      <span>{row.customer?.name ?? '—'}</span>
    )),
    componentColumn<OrderPublic>('phone', 'Teléfono', (row) => (
      <span>{row.customer?.phone ?? '—'}</span>
    )),
    status,
    totals,
    created,
    actions,
  ]
}

export function buildProviderOrderColumns(): ColumnDef<OrderPublic>[] {
  return buildSharedOrderColumns()
}
