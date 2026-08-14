import type { OrderItemPublic } from '@broker/api'
import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'

import { DataTable } from '../components/data-table/data-table'
import type { ColumnDef } from '../components/data-table/types'

export type OrderItemProductInfo = {
  name: string
  image_url?: string | null
}

export type OrderItemsTableProps = {
  items: OrderItemPublic[]
  fetchProduct: (
    productId: string,
    signal?: AbortSignal,
  ) => Promise<OrderItemProductInfo>
  productQueryKeyPrefix: string
  buildColumns: (ctx: {
    getProductName: (id: string) => string
    getProductImageUrl: (id: string) => string | null | undefined
  }) => ColumnDef<OrderItemPublic>[]
}

export function OrderItemsTable({
  items,
  fetchProduct,
  productQueryKeyPrefix,
  buildColumns,
}: OrderItemsTableProps) {
  const productIds = useMemo(
    () => [...new Set(items.map((item) => item.product_id))],
    [items],
  )

  const productQueries = useQueries({
    queries: productIds.map((productId) => ({
      queryKey: [productQueryKeyPrefix, productId],
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        fetchProduct(productId, signal),
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

  const imageUrlByProductId = useMemo(() => {
    const map = new Map<string, string | null | undefined>()
    productIds.forEach((productId, index) => {
      const data = productQueries[index]?.data
      if (data) map.set(productId, data.image_url)
    })
    return map
  }, [productIds, productQueries])

  const columns = useMemo(
    () =>
      buildColumns({
        getProductName: (id) => nameByProductId.get(id) ?? '…',
        getProductImageUrl: (id) => imageUrlByProductId.get(id),
      }),
    [buildColumns, imageUrlByProductId, nameByProductId],
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
