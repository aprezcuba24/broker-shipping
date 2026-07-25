import {
  formatApiError,
  getGetOrderOrdersOrderIdGetQueryKey,
  getListSellerOrdersOrdersSellerGetQueryKey,
  OrderStatus,
  useCancelOrderOrdersOrderIdCancelPost,
  useGetOrderOrdersOrderIdGet,
} from '@broker/api'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

export function useOrderDetail() {
  const { orderId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [cancelError, setCancelError] = useState<string | null>(null)

  const {
    data: order,
    isLoading,
    isError,
  } = useGetOrderOrdersOrderIdGet(orderId, {
    query: { enabled: !!orderId },
  })

  const cancelMutation = useCancelOrderOrdersOrderIdCancelPost({
    mutation: {
      onSuccess: (updatedOrder) => {
        queryClient.setQueryData(getGetOrderOrdersOrderIdGetQueryKey(orderId), updatedOrder)
        void queryClient.invalidateQueries({
          queryKey: getListSellerOrdersOrdersSellerGetQueryKey(),
        })
        setCancelError(null)
      },
      onError: (error) => {
        setCancelError(formatApiError(error))
      },
    },
  })

  const handleCancel = useCallback(async () => {
    await cancelMutation.mutateAsync({ orderId })
  }, [cancelMutation, orderId])

  const backTo = useMemo(() => {
    const backSearch = searchParams.toString()
    return backSearch ? `/orders?${backSearch}` : '/orders'
  }, [searchParams])

  const canCancel = order?.status === OrderStatus.created

  return {
    orderId,
    order,
    isLoading,
    isError,
    backTo,
    canCancel,
    cancelError,
    handleCancel,
    isCanceling: cancelMutation.isPending,
  }
}
