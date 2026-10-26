import type { Money, StorefrontProductPublic } from '@broker/api'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartBook = Pick<
  StorefrontProductPublic,
  'id' | 'name' | 'description' | 'price' | 'stock' | 'image_url' | 'tags'
>

export type CartItem = {
  book: CartBook
  quantity: number
}

type CartState = {
  items: CartItem[]
  addBook: (book: CartBook, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  removeBook: (productId: string) => void
  clearCart: () => void
}

function clampQuantity(quantity: number, stock: number): number {
  return Math.max(0, Math.min(quantity, Math.max(stock, 0)))
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addBook: (book, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((item) => item.book.id === book.id)
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.book.id === book.id
                  ? {
                      book,
                      quantity: clampQuantity(
                        item.quantity + quantity,
                        book.stock,
                      ),
                    }
                  : item,
              ),
            }
          }
          const nextQuantity = clampQuantity(quantity, book.stock)
          if (nextQuantity <= 0) return state
          return { items: [...state.items, { book, quantity: nextQuantity }] }
        }),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.book.id === productId
                ? {
                    ...item,
                    quantity: clampQuantity(quantity, item.book.stock),
                  }
                : item,
            )
            .filter((item) => item.quantity > 0),
        })),
      removeBook: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.book.id !== productId),
        })),
      clearCart: () => set({ items: [] }),
    }),
    { name: 'broker-store-cart' },
  ),
)

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

export function cartTotalsByCurrency(items: CartItem[]): Money[] {
  const byCurrency = new Map<string, number>()
  for (const item of items) {
    const key = item.book.price.currency
    byCurrency.set(
      key,
      (byCurrency.get(key) ?? 0) + item.book.price.amount * item.quantity,
    )
  }
  return [...byCurrency.entries()].map(([currency, amount]) => ({
    amount,
    currency: currency as Money['currency'],
  }))
}
