import {
  componentColumn,
  formatMoney,
  imageColumn,
  SellerProductPriceBadge,
  textColumn,
  type ColumnDef,
} from '@broker/ui'

import { ProductCartControl } from '@/components/product-cart-control'
import type { CartItem, CartProductSnapshot } from '@/stores/cart-store'

import { useCartPreviewContext } from './cart-preview-context'
import { lineSubtotal } from './cart-utils'

export type BuildCartColumnsOptions = {
  getProviderName: (id: string | null | undefined) => string
}

function PreviewCommissionCell({ productId }: { productId: string }) {
  const { previewByProductId } = useCartPreviewContext()
  const preview = previewByProductId.get(productId)
  return (
    <span className="tabular-nums text-sm">
      {preview ? formatMoney(preview.seller_commission) : '—'}
    </span>
  )
}

function canShowPriceBadge(
  product: CartProductSnapshot,
): product is CartProductSnapshot & {
  has_commission: boolean
  price: NonNullable<CartProductSnapshot['price']>
} {
  return product.has_commission !== undefined && product.price != null
}

function PreviewPriceCell({ product }: { product: CartProductSnapshot }) {
  const { previewByProductId } = useCartPreviewContext()
  const preview = previewByProductId.get(product.id)
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="tabular-nums text-sm">
        {preview ? formatMoney(preview.seller_provider_price) : '—'}
      </span>
      {canShowPriceBadge(product) ? (
        <SellerProductPriceBadge product={product} />
      ) : null}
    </div>
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
      {preview
        ? formatMoney(
            lineSubtotal(preview, quantity),
            preview.seller_provider_price.currency,
          )
        : '—'}
    </span>
  )
}

export function buildCartColumns({
  getProviderName,
}: BuildCartColumnsOptions): ColumnDef<CartItem>[] {
  return [
    imageColumn<CartItem>({
      src: (row) => row.product.image_url,
      alt: (row) => row.product.name,
    }),
    textColumn<CartItem>({
      id: 'name',
      header: 'Producto',
      cell: (row) => row.product.name,
      className: 'font-medium',
    }),
    componentColumn<CartItem>('provider', 'Proveedor', (row) => (
      <span>{getProviderName(row.product.organization_id)}</span>
    )),
    componentColumn<CartItem>('commission', 'Comisión', (row) => (
      <PreviewCommissionCell productId={row.product.id} />
    )),
    componentColumn<CartItem>('price', 'Precio', (row) => (
      <PreviewPriceCell product={row.product} />
    )),
    componentColumn<CartItem>('subtotal', 'Subtotal', (row) => (
      <PreviewSubtotalCell productId={row.product.id} quantity={row.quantity} />
    )),
    componentColumn<CartItem>('quantity', 'Cantidad', (row) => (
      <ProductCartControl product={row.product} />
    )),
  ]
}
