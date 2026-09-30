import type { OrderItemPublic } from '@broker/api'

import { componentColumn, imageColumn } from '../crud/components/columns'
import type { ColumnDef } from '../components/data-table/types'
import { formatMoney } from '../lib/utils'
import { OrderItemStatusBadge } from './status'

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
    componentColumn<OrderItemPublic>('price', 'Precio', (row) => (
      <span className="tabular-nums text-sm">
        {formatMoney(row.seller_provider_price)}
      </span>
    )),
    componentColumn<OrderItemPublic>('commission', 'Comisión', (row) => (
      <span className="tabular-nums text-sm">
        {formatMoney(row.seller_commission)}
      </span>
    )),
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
    componentColumn<OrderItemPublic>('price', 'Precio', (row) => (
      <span className="tabular-nums text-sm">
        {formatMoney(row.unit_provider_price)}
      </span>
    )),
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
