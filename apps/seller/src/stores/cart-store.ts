import type { Product } from '@broker/api'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const CART_STORAGE_KEY = 'broker:seller:cart'

export interface CartLine {
  product_id: string
  product: Product
  quantity: number
  price: number
}

export interface CartSummary {
  itemCount: number
  total: number
}

interface CartState {
  lines: CartLine[]
}

interface CartActions {
  addProduct: (product: Product, quantity?: number) => void
  removeProduct: (productId: string) => void
  decreaseQuantity: (productId: string, quantity?: number) => void
  clearCart: () => void
  getSummary: () => CartSummary
}

export type CartStore = CartState & CartActions

function computeSummary(lines: CartLine[]): CartSummary {
  return lines.reduce<CartSummary>(
    (summary, line) => ({
      itemCount: summary.itemCount + line.quantity,
      total: summary.total + line.price * line.quantity,
    }),
    { itemCount: 0, total: 0 },
  )
}

export function selectCartSummary(state: CartStore): CartSummary {
  return computeSummary(state.lines)
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      lines: [],

      addProduct: (product, quantity = 1) => {
        const productId = product.id
        if (!productId || quantity <= 0) return
        set((state) => {
          const existing = state.lines.find((line) => line.product_id === productId)
          if (existing) {
            return {
              lines: state.lines.map((line) =>
                line.product_id === productId
                  ? { ...line, quantity: line.quantity + quantity }
                  : line,
              ),
            }
          }
          return {
            lines: [
              ...state.lines,
              {
                product_id: productId,
                product,
                quantity,
                price: product.price,
              },
            ],
          }
        })
      },

      removeProduct: (productId) => {
        set((state) => ({
          lines: state.lines.filter((line) => line.product_id !== productId),
        }))
      },

      decreaseQuantity: (productId, quantity = 1) => {
        if (quantity <= 0) return
        set((state) => ({
          lines: state.lines
            .map((line) =>
              line.product_id === productId
                ? { ...line, quantity: line.quantity - quantity }
                : line,
            )
            .filter((line) => line.quantity > 0),
        }))
      },

      clearCart: () => set({ lines: [] }),

      getSummary: () => computeSummary(get().lines),
    }),
    {
      name: CART_STORAGE_KEY,
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
)
