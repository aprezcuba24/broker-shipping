import {
  getProductProductsProviderProductIdGet,
  useGetOrderOrdersProviderOrderIdGet,
  type GetOrderOrdersProviderOrderIdGetParams,
  type GetProductProductsProviderProductIdGetParams,
} from '@broker/api'
import {
  buildProviderOrderItemColumns,
  OrderDetailPage as OrderDetailView,
  OrderItemsTable,
  OrderStatusActions,
} from '@broker/ui'
import { useCallback } from 'react'
import { useParams } from 'react-router-dom'

export function OrderDetailPage() {
  const { orderId = '' } = useParams<{ orderId: string }>()

  const orderQuery = useGetOrderOrdersProviderOrderIdGet(
    orderId,
    {} as GetOrderOrdersProviderOrderIdGetParams,
    { query: { enabled: Boolean(orderId) } },
  )

  const fetchProduct = useCallback(
    (productId: string, signal?: AbortSignal) =>
      getProductProductsProviderProductIdGet(
        productId,
        {} as GetProductProductsProviderProductIdGetParams,
        undefined,
        signal,
      ),
    [],
  )

  const buildColumns = useCallback(
    ({ getProductName }: { getProductName: (id: string) => string }) =>
      buildProviderOrderItemColumns({ getProductName }),
    [],
  )

  const order = orderQuery.data

  return (
    <OrderDetailView
      isLoading={!orderId || orderQuery.isLoading}
      isError={orderQuery.isError}
      order={order}
    >
      {order ? (
        <>
          <div className="space-y-2">
            <h2 className="text-sm font-medium">Acciones</h2>
            <OrderStatusActions orderId={order.id} items={order.items ?? []} />
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-medium">Ítems</h2>
            <OrderItemsTable
              items={order.items ?? []}
              fetchProduct={fetchProduct}
              productQueryKeyPrefix="provider-product-name"
              buildColumns={buildColumns}
            />
          </div>
        </>
      ) : null}
    </OrderDetailView>
  )
}
