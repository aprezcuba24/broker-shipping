import type { OrderItemPublic } from '@broker/api'
import {
  getProductProductsSellerProductIdGet,
  type GetProductProductsSellerProductIdGetParams,
} from '@broker/api'
import {
  DataTable,
  componentColumn,
  formatMoney,
  type ColumnDef,
} from '@broker/ui'
import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'

import { useLinkedProviders } from '@/hooks/use-linked-providers'

export type OrderItemsTableProps = {
  items: OrderItemPublic[]
}

function buildOrderItemColumns(options: {
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
  ]
}

export function OrderItemsTable({ items }: OrderItemsTableProps) {
  const { getProviderName } = useLinkedProviders()

  const productIds = useMemo(
    () => [...new Set(items.map((item) => item.product_id))],
    [items],
  )

  const productQueries = useQueries({
    queries: productIds.map((productId) => ({
      queryKey: ['seller-product-name', productId],
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        getProductProductsSellerProductIdGet(
          productId,
          {} as GetProductProductsSellerProductIdGetParams,
          undefined,
          signal,
        ),
      enabled: Boolean(productId),
      staleTime: 60_000,
    })),
  })

  const nameByProductId = useMemo(() => {
    const map = new Map<string, string>()
    productIds.forEach((productId, index) => {
      const data = productQueries[index]?.data
      if (data) map.set(productId, data.name)
    })
    return map
  }, [productIds, productQueries])

  const columns = useMemo(
    () =>
      buildOrderItemColumns({
        getProductName: (id) => nameByProductId.get(id) ?? '…',
        getProviderName,
      }),
    [getProviderName, nameByProductId],
  )

  return (
    <DataTable
      columns={columns}
      data={items}
      getRowId={(row) => row.id}
      pagination={{
        page: 1,
        total: items.length,
        onPageChange: () => {},
      }}
    />
  )
}
