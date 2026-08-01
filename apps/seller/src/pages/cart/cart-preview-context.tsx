import type { OrderItemPublic } from '@broker/api'
import { createContext, use, type ReactNode } from 'react'

export type CartPreviewContextValue = {
  previewByProductId: Map<string, OrderItemPublic>
}

const CartPreviewContext = createContext<CartPreviewContextValue | null>(null)

export function CartPreviewProvider({
  previewByProductId,
  children,
}: CartPreviewContextValue & { children: ReactNode }) {
  return (
    <CartPreviewContext value={{ previewByProductId }}>
      {children}
    </CartPreviewContext>
  )
}

export function useCartPreviewContext() {
  const value = use(CartPreviewContext)
  if (!value) {
    throw new Error('useCartPreviewContext must be used within CartPreviewProvider')
  }
  return value
}
