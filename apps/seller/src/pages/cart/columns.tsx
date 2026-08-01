import type { OrderItemPublic } from '@broker/api'
import { componentColumn, textColumn, type ColumnDef } from '@broker/ui'

import { ProductCartControl } from '@/components/product-cart-control'
import type { CartItem } from '@/stores/cart-store'

import { formatMoney, lineSubtotal } from './cart-utils'

export type BuildCartColumnsOptions = {
  getProviderName: (id: string | null | undefined) => string
  previewByProductId: Map<string, OrderItemPublic>
}

export function buildCartColumns({
  getProviderName,
  previewByProductId,
}: BuildCartColumnsOptions): ColumnDef<CartItem>[] {
  return [
    textColumn<CartItem>({
      id: 'name',
      header: 'Producto',
      cell: (row) => row.product.name,
      className: 'font-medium',
    }),
    componentColumn<CartItem>('provider', 'Proveedor', (row) => (
      <span>{getProviderName(row.product.organization_id)}</span>
    )),
    componentColumn<CartItem>('quantity', 'Cantidad', (row) => (
      <ProductCartControl product={row.product} />
    )),
    componentColumn<CartItem>('currency', 'Moneda', (row) => {
      const preview = previewByProductId.get(row.product.id)
      return (
        <span className="tabular-nums text-sm">
          {preview ? preview.currency.toUpperCase() : '—'}
        </span>
      )
    }),
    componentColumn<CartItem>('commission', 'Comisión', (row) => {
      const preview = previewByProductId.get(row.product.id)
      return (
        <span className="tabular-nums text-sm">
          {preview ? formatMoney(preview.seller_commission, preview.currency) : '—'}
        </span>
      )
    }),
    componentColumn<CartItem>('price', 'Precio', (row) => {
      const preview = previewByProductId.get(row.product.id)
      return (
        <span className="tabular-nums text-sm">
          {preview ? formatMoney(preview.seller_provider_price, preview.currency) : '—'}
        </span>
      )
    }),
    componentColumn<CartItem>('subtotal', 'Subtotal', (row) => {
      const preview = previewByProductId.get(row.product.id)
      return (
        <span className="tabular-nums text-sm">
          {preview ? formatMoney(lineSubtotal(preview), preview.currency) : '—'}
        </span>
      )
    }),
  ]
}
