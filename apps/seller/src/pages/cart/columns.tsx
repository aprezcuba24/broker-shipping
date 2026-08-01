import { componentColumn, formatMoney, textColumn, type ColumnDef } from '@broker/ui'

import { ProductCartControl } from '@/components/product-cart-control'
import type { CartItem } from '@/stores/cart-store'

import { useCartPreviewContext } from './cart-preview-context'
import { lineSubtotal } from './cart-utils'

export type BuildCartColumnsOptions = {
  getProviderName: (id: string | null | undefined) => string
}

function PreviewCurrencyCell({ productId }: { productId: string }) {
  const { previewByProductId } = useCartPreviewContext()
  const preview = previewByProductId.get(productId)
  return (
    <span className="tabular-nums text-sm">
      {preview ? preview.currency.toUpperCase() : '—'}
    </span>
  )
}

function PreviewCommissionCell({ productId }: { productId: string }) {
  const { previewByProductId } = useCartPreviewContext()
  const preview = previewByProductId.get(productId)
  return (
    <span className="tabular-nums text-sm">
      {preview ? formatMoney(preview.seller_commission, preview.currency) : '—'}
    </span>
  )
}

function PreviewPriceCell({ productId }: { productId: string }) {
  const { previewByProductId } = useCartPreviewContext()
  const preview = previewByProductId.get(productId)
  return (
    <span className="tabular-nums text-sm">
      {preview ? formatMoney(preview.seller_provider_price, preview.currency) : '—'}
    </span>
  )
}

function PreviewSubtotalCell({
  productId,
  quantity,
}: {
  productId: string
  quantity: number
}) {
  const { previewByProductId } = useCartPreviewContext()
  const preview = previewByProductId.get(productId)
  return (
    <span className="tabular-nums text-sm">
      {preview ? formatMoney(lineSubtotal(preview, quantity), preview.currency) : '—'}
    </span>
  )
}

export function buildCartColumns({
  getProviderName,
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
    componentColumn<CartItem>('currency', 'Moneda', (row) => (
      <PreviewCurrencyCell productId={row.product.id} />
    )),
    componentColumn<CartItem>('commission', 'Comisión', (row) => (
      <PreviewCommissionCell productId={row.product.id} />
    )),
    componentColumn<CartItem>('price', 'Precio', (row) => (
      <PreviewPriceCell productId={row.product.id} />
    )),
    componentColumn<CartItem>('subtotal', 'Subtotal', (row) => (
      <PreviewSubtotalCell productId={row.product.id} quantity={row.quantity} />
    )),
    componentColumn<CartItem>('quantity', 'Cantidad', (row) => (
      <ProductCartControl product={row.product} />
    )),
  ]
}
