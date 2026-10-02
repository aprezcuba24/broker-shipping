import type { OrderItemPublic } from '@broker/api'

import {
  badgeColumn,
  componentColumn,
  currencyMoneyColumn,
  imageColumn,
  linkColumn,
  moneyColumn,
  numberColumn,
  textColumn,
} from '../crud/components/columns'
import type { ColumnDef } from '../components/data-table/types'
import { formatMoney, formatSellerCommissions } from '../lib/utils'
import { OrderItemStatusBadge } from './status'

const productColumn = linkColumn<OrderItemPublic>({
  id: 'product',
  header: 'Producto',
  getHref: (row) => `/products/${row.product_id}`,
  getLabel: (row) => row.product_name,
})

const quantityColumn = numberColumn<OrderItemPublic>({
  id: 'quantity',
  header: 'Cant.',
})

const providerPriceColumn = currencyMoneyColumn<OrderItemPublic>({
  id: 'unit_provider_price',
  header: 'Precio proveedor',
})

const sellerPriceColumn = currencyMoneyColumn<OrderItemPublic>({
  id: 'seller_provider_price',
  header: 'Precio vendedor',
})

const commissionColumn = componentColumn<OrderItemPublic>(
  'commission',
  'Comisión',
  (row) => (
    <span className="tabular-nums text-sm">{formatSellerCommissions(row)}</span>
  ),
)

const statusColumn = badgeColumn<OrderItemPublic>({
  id: 'status',
  header: 'Estado',
  renderBadge: (row) => <OrderItemStatusBadge status={row.status} />,
})

export function buildSellerOrderItemColumns(): ColumnDef<OrderItemPublic>[] {
  return [
    imageColumn<OrderItemPublic>({
      src: (row) => row.product_image_url,
      alt: (row) => row.product_name ?? '',
    }),
    productColumn,
    textColumn<OrderItemPublic>({
      id: 'provider_organization_name',
      header: 'Proveedor',
    }),
    quantityColumn,
    providerPriceColumn,
    sellerPriceColumn,
    commissionColumn,
    moneyColumn<OrderItemPublic>({
      id: 'subtotal',
      header: 'Subtotal',
      cell: (row) => (
        <span className="tabular-nums text-sm font-medium">
          {formatMoney(
            row.seller_provider_price.amount * row.quantity,
            row.seller_provider_price.currency,
          )}
        </span>
      ),
    }),
    statusColumn,
  ]
}

export function buildProviderOrderItemColumns(): ColumnDef<OrderItemPublic>[] {
  return [
    productColumn,
    quantityColumn,
    providerPriceColumn,
    sellerPriceColumn,
    commissionColumn,
    moneyColumn<OrderItemPublic>({
      id: 'subtotal',
      header: 'Subtotal',
      cell: (row) => (
        <span className="tabular-nums text-sm font-medium">
          {formatMoney(
            row.unit_provider_price.amount * row.quantity,
            row.unit_provider_price.currency,
          )}
        </span>
      ),
    }),
    statusColumn,
  ]
}
