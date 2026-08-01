import {
  usePreviewOrderOrdersSellerPreviewPost,
  type OrderItemPublic,
  type OrderPublic,
  type PreviewOrderOrdersSellerPreviewPostParams,
} from '@broker/api'
import { useEffect, useMemo, useRef } from 'react'

import { useCart } from '@/hooks/use-cart'

const PREVIEW_DEBOUNCE_MS = 300

export function useCartPreview() {
  const { items, sellerOrgId } = useCart()
  const mutation = usePreviewOrderOrdersSellerPreviewPost()
  const mutateRef = useRef(mutation.mutate)
  const resetRef = useRef(mutation.reset)
  mutateRef.current = mutation.mutate
  resetRef.current = mutation.reset

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

  useEffect(() => {
    if (!sellerOrgId || items.length === 0) {
      resetRef.current()
      return
    }

    const snapshot = items
    const timer = window.setTimeout(() => {
      mutateRef.current({
        data: snapshot.map(({ product, quantity }) => ({
          product_id: product.id,
          quantity,
        })),
        params: {} as PreviewOrderOrdersSellerPreviewPostParams,
      })
    }, PREVIEW_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [itemsKey, sellerOrgId, items])

  const order: OrderPublic | null = items.length === 0 ? null : (mutation.data ?? null)

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
    isLoading: items.length > 0 && mutation.isPending,
    isError: mutation.isError,
  }
}
