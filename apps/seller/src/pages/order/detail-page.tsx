import {
  useGetOrderOrdersSellerOrderIdGet,
  type GetOrderOrdersSellerOrderIdGetParams,
} from '@broker/api'
import {
  buildSellerOrderItemColumns,
  OrderItemsTable,
  SellerOrderDetailPage as OrderDetailView,
} from '@broker/ui'
import { useCallback } from 'react'
import { useParams } from 'react-router-dom'

export function OrderDetailPage() {
  const { orderId = '' } = useParams<{ orderId: string }>()

  const orderQuery = useGetOrderOrdersSellerOrderIdGet(
    orderId,
    {} as GetOrderOrdersSellerOrderIdGetParams,
    { query: { enabled: Boolean(orderId) } },
  )

  const buildColumns = useCallback(() => buildSellerOrderItemColumns(), [])

  return (
    <OrderDetailView
      isLoading={!orderId || orderQuery.isLoading}
      isError={orderQuery.isError}
      order={orderQuery.data}
    >
      <div className="space-y-2">
        <h2 className="text-sm font-medium">Ítems</h2>
        <OrderItemsTable
          items={orderQuery.data?.items ?? []}
          buildColumns={buildColumns}
        />
      </div>
    </OrderDetailView>
  )
}
