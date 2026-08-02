import {
  getProductProductsSellerProductIdGet,
  useGetOrderOrdersSellerOrderIdGet,
  type GetOrderOrdersSellerOrderIdGetParams,
  type GetProductProductsSellerProductIdGetParams,
} from '@broker/api'
import {
  buildSellerOrderItemColumns,
  OrderDetailPage as OrderDetailView,
  orderDetailCustomerFields,
  OrderItemsTable,
} from '@broker/ui'
import { useCallback } from 'react'
import { useParams } from 'react-router-dom'

import { useLinkedProviders } from '@/hooks/use-linked-providers'

export function OrderDetailPage() {
  const { orderId = '' } = useParams<{ orderId: string }>()
  const { getProviderName } = useLinkedProviders()

  const orderQuery = useGetOrderOrdersSellerOrderIdGet(
    orderId,
    {} as GetOrderOrdersSellerOrderIdGetParams,
    { query: { enabled: Boolean(orderId) } },
  )

  const fetchProduct = useCallback(
    (productId: string, signal?: AbortSignal) =>
      getProductProductsSellerProductIdGet(
        productId,
        {} as GetProductProductsSellerProductIdGetParams,
        undefined,
        signal,
      ),
    [],
  )

  const buildColumns = useCallback(
    ({ getProductName }: { getProductName: (id: string) => string }) =>
      buildSellerOrderItemColumns({ getProductName, getProviderName }),
    [getProviderName],
  )

  return (
    <OrderDetailView
      isLoading={!orderId || orderQuery.isLoading}
      isError={orderQuery.isError}
      order={orderQuery.data}
      extraFields={orderDetailCustomerFields}
    >
      <div className="space-y-2">
        <h2 className="text-sm font-medium">Ítems</h2>
        <OrderItemsTable
          items={orderQuery.data?.items ?? []}
          fetchProduct={fetchProduct}
          productQueryKeyPrefix="seller-product-name"
          buildColumns={buildColumns}
        />
      </div>
    </OrderDetailView>
  )
}
