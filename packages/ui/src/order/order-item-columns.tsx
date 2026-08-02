import type { OrderItemPublic } from '@broker/api'

import { componentColumn } from '../crud/components/columns'
import type { ColumnDef } from '../components/data-table/types'
import { formatMoney } from '../lib/utils'
import { OrderItemStatusBadge } from './status'

export function buildSellerOrderItemColumns(options: {
  getProductName: (productId: string) => string
  getProviderName: (id: string | null | undefined) => string
}): ColumnDef<OrderItemPublic>[] {
  const { getProductName, getProviderName } = options
  return [
    componentColumn<OrderItemPublic>('product', 'Producto', (row) => (
      <span>{getProductName(row.product_id)}</span>
    )),
    componentColumn<OrderItemPublic>('provider', 'Proveedor', (row) => (
      <span>{getProviderName(row.provider_organization_id)}</span>
    )),
    componentColumn<OrderItemPublic>('quantity', 'Cant.', (row) => (
      <span className="tabular-nums text-sm">{row.quantity}</span>
    )),
    componentColumn<OrderItemPublic>('currency', 'Moneda', (row) => (
      <span className="tabular-nums text-sm">{row.currency.toUpperCase()}</span>
    )),
    componentColumn<OrderItemPublic>('price', 'Precio', (row) => (
      <span className="tabular-nums text-sm">
        {formatMoney(row.seller_provider_price, row.currency)}
      </span>
    )),
    componentColumn<OrderItemPublic>('commission', 'Comisión', (row) => (
      <span className="tabular-nums text-sm">
        {formatMoney(row.seller_commission, row.currency)}
      </span>
    )),
    componentColumn<OrderItemPublic>('subtotal', 'Subtotal', (row) => (
      <span className="tabular-nums text-sm font-medium">
        {formatMoney(row.seller_provider_price * row.quantity, row.currency)}
      </span>
    )),
    componentColumn<OrderItemPublic>('status', 'Estado', (row) => (
      <OrderItemStatusBadge status={row.status} />
    )),
  ]
}

export function buildProviderOrderItemColumns(options: {
  getProductName: (productId: string) => string
}): ColumnDef<OrderItemPublic>[] {
  const { getProductName } = options
  return [
    componentColumn<OrderItemPublic>('product', 'Producto', (row) => (
      <span>{getProductName(row.product_id)}</span>
    )),
    componentColumn<OrderItemPublic>('quantity', 'Cant.', (row) => (
      <span className="tabular-nums text-sm">{row.quantity}</span>
    )),
    componentColumn<OrderItemPublic>('currency', 'Moneda', (row) => (
      <span className="tabular-nums text-sm">{row.currency.toUpperCase()}</span>
    )),
    componentColumn<OrderItemPublic>('price', 'Precio', (row) => (
      <span className="tabular-nums text-sm">
        {formatMoney(row.unit_provider_price, row.currency)}
      </span>
    )),
    componentColumn<OrderItemPublic>('subtotal', 'Subtotal', (row) => (
      <span className="tabular-nums text-sm font-medium">
        {formatMoney(row.unit_provider_price * row.quantity, row.currency)}
      </span>
    )),
    componentColumn<OrderItemPublic>('status', 'Estado', (row) => (
      <OrderItemStatusBadge status={row.status} />
    )),
  ]
}
