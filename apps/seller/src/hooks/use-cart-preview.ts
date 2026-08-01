import {
  previewOrderOrdersSellerPreviewPost,
  type OrderItemPublic,
  type OrderPublic,
  type PreviewOrderOrdersSellerPreviewPostParams,
} from '@broker/api'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import { useCart } from '@/hooks/use-cart'

const PREVIEW_DEBOUNCE_MS = 300

export function useCartPreview() {
  const { items, sellerOrgId } = useCart()

  const itemsKey = useMemo(
    () =>
      JSON.stringify(
        items.map((item) => ({
          id: item.product.id,
          quantity: item.quantity,
        })),
      ),
    [items],
  )

  const [debouncedItemsKey, setDebouncedItemsKey] = useState(itemsKey)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedItemsKey(itemsKey)
    }, PREVIEW_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [itemsKey])

  const hasItems = items.length > 0
  const enabled = Boolean(sellerOrgId) && hasItems

  const query = useQuery({
    queryKey: ['cart-preview', sellerOrgId, debouncedItemsKey],
    queryFn: ({ signal }) => {
      const snapshot = JSON.parse(debouncedItemsKey) as Array<{
        id: string
        quantity: number
      }>
      return previewOrderOrdersSellerPreviewPost(
        snapshot.map(({ id, quantity }) => ({
          product_id: id,
          quantity,
        })),
        {} as PreviewOrderOrdersSellerPreviewPostParams,
        undefined,
        signal,
      )
    },
    enabled: enabled && debouncedItemsKey !== '[]',
    placeholderData: keepPreviousData,
  })

  const order: OrderPublic | null = hasItems ? (query.data ?? null) : null

  const previewByProductId = useMemo(() => {
    const map = new Map<string, OrderItemPublic>()
    for (const item of order?.items ?? []) {
      map.set(item.product_id, item)
    }
    return map
  }, [order])

  return {
    order,
    previewByProductId,
    isInitialLoading: hasItems && !order && query.isFetching,
    isRefreshing: hasItems && Boolean(order) && query.isFetching && !query.isLoading,
    isError: query.isError,
  }
}
