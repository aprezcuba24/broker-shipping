import { useActiveOrganization } from '@broker/ui'
import { useCallback, useMemo } from 'react'

import {
  getCartItems,
  getCartQuantity,
  getCartTotalItems,
  useCartStore,
  type CartProductSnapshot,
} from '@/stores/cart-store'

export function useCart() {
  const { activeOrganization } = useActiveOrganization()
  const sellerOrgId = activeOrganization?.id

  const cartsByOrganization = useCartStore((s) => s.cartsByOrganization)
  const addProductAction = useCartStore((s) => s.addProduct)
  const incrementAction = useCartStore((s) => s.increment)
  const decrementAction = useCartStore((s) => s.decrement)
  const removeProductAction = useCartStore((s) => s.removeProduct)
  const clearCartAction = useCartStore((s) => s.clearCart)

  const items = useMemo(
    () => getCartItems(cartsByOrganization, sellerOrgId),
    [cartsByOrganization, sellerOrgId],
  )

  const totalItems = useMemo(
    () => getCartTotalItems(cartsByOrganization, sellerOrgId),
    [cartsByOrganization, sellerOrgId],
  )

  const getQuantity = useCallback(
    (productId: string) => getCartQuantity(cartsByOrganization, sellerOrgId, productId),
    [cartsByOrganization, sellerOrgId],
  )

  const addProduct = useCallback(
    (product: CartProductSnapshot) => {
      if (!sellerOrgId) return
      addProductAction(sellerOrgId, product)
    },
    [addProductAction, sellerOrgId],
  )

  const increment = useCallback(
    (productId: string) => {
      if (!sellerOrgId) return
      incrementAction(sellerOrgId, productId)
    },
    [incrementAction, sellerOrgId],
  )

  const decrement = useCallback(
    (productId: string) => {
      if (!sellerOrgId) return
      decrementAction(sellerOrgId, productId)
    },
    [decrementAction, sellerOrgId],
  )

  const removeProduct = useCallback(
    (productId: string) => {
      if (!sellerOrgId) return
      removeProductAction(sellerOrgId, productId)
    },
    [removeProductAction, sellerOrgId],
  )

  const clearCart = useCallback(() => {
    if (!sellerOrgId) return
    clearCartAction(sellerOrgId)
  }, [clearCartAction, sellerOrgId])

  return {
    sellerOrgId,
    items,
    totalItems,
    getQuantity,
    addProduct,
    increment,
    decrement,
    removeProduct,
    clearCart,
  }
}
