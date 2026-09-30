import type { OrderItemPublic } from '@broker/api'

import { componentColumn, imageColumn } from '../crud/components/columns'
import type { ColumnDef } from '../components/data-table/types'
import { formatMoney, formatSellerCommissions } from '../lib/utils'
import { OrderItemStatusBadge } from './status'

const commissionColumn = componentColumn<OrderItemPublic>(
  'commission',
  'Comisión',
  (row) => (
    <span className="tabular-nums text-sm">{formatSellerCommissions(row)}</span>
  ),
)

export function buildSellerOrderItemColumns(): ColumnDef<OrderItemPublic>[] {
  return [
    imageColumn<OrderItemPublic>({
      src: (row) => row.product_image_url,
      alt: (row) => row.product_name ?? '',
    }),
    componentColumn<OrderItemPublic>('product', 'Producto', (row) => (
      <span>{row.product_name || '—'}</span>
    )),
    componentColumn<OrderItemPublic>('provider', 'Proveedor', (row) => (
      <span>{row.provider_organization_name || '—'}</span>
    )),
    componentColumn<OrderItemPublic>('quantity', 'Cant.', (row) => (
      <span className="tabular-nums text-sm">{row.quantity}</span>
    )),
    componentColumn<OrderItemPublic>('provider_price', 'Precio proveedor', (row) => (
      <span className="tabular-nums text-sm">
        {formatMoney(row.unit_provider_price)}
      </span>
    )),
    componentColumn<OrderItemPublic>('seller_price', 'Precio vendedor', (row) => (
      <span className="tabular-nums text-sm">
        {formatMoney(row.seller_provider_price)}
      </span>
    )),
    commissionColumn,
    componentColumn<OrderItemPublic>('subtotal', 'Subtotal', (row) => (
      <span className="tabular-nums text-sm font-medium">
        {formatMoney(
          row.seller_provider_price.amount * row.quantity,
          row.seller_provider_price.currency,
        )}
      </span>
    )),
    componentColumn<OrderItemPublic>('status', 'Estado', (row) => (
      <OrderItemStatusBadge status={row.status} />
    )),
  ]
}

export function buildProviderOrderItemColumns(): ColumnDef<OrderItemPublic>[] {
  return [
    componentColumn<OrderItemPublic>('product', 'Producto', (row) => (
      <span>{row.product_name || '—'}</span>
    )),
    componentColumn<OrderItemPublic>('quantity', 'Cant.', (row) => (
      <span className="tabular-nums text-sm">{row.quantity}</span>
    )),
    componentColumn<OrderItemPublic>('provider_price', 'Precio proveedor', (row) => (
      <span className="tabular-nums text-sm">
        {formatMoney(row.unit_provider_price)}
      </span>
    )),
    componentColumn<OrderItemPublic>('seller_price', 'Precio vendedor', (row) => (
      <span className="tabular-nums text-sm">
        {formatMoney(row.seller_provider_price)}
      </span>
    )),
    commissionColumn,
    componentColumn<OrderItemPublic>('subtotal', 'Subtotal', (row) => (
      <span className="tabular-nums text-sm font-medium">
        {formatMoney(
          row.unit_provider_price.amount * row.quantity,
          row.unit_provider_price.currency,
        )}
      </span>
    )),
    componentColumn<OrderItemPublic>('status', 'Estado', (row) => (
      <OrderItemStatusBadge status={row.status} />
    )),
  ]
}
