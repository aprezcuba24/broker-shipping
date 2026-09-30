import {
  useGetOrderOrdersSellerOrderIdGet,
  type GetOrderOrdersSellerOrderIdGetParams,
} from '@broker/api'
import {
  buildSellerOrderItemColumns,
  OrderItemsTable,
  OrderMessagingSection,
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

  const order = orderQuery.data

  return (
    <OrderDetailView
      isLoading={!orderId || orderQuery.isLoading}
      isError={orderQuery.isError}
      order={order}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Ítems</h2>
          <OrderItemsTable
            items={order?.items ?? []}
            buildColumns={buildColumns}
          />
        </div>
        {order ? <OrderMessagingSection order={order} /> : null}
      </div>
    </OrderDetailView>
  )
}
