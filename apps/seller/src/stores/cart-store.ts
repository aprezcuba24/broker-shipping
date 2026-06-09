import {
  createOrderOrdersPost,
  type OrderDetail,
  type Product,
} from '@broker/api'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const CART_STORAGE_KEY = 'broker:seller:cart'

export interface CartLine {
  product_id: string
  product: Product
  quantity: number
  price: number
  line_total: number
  provider_organization_id: string
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
  createOrder: (input: {
    name: string
    customer_phone: string
  }) => Promise<OrderDetail>
}

export type CartStore = CartState & CartActions

function withLineTotal(line: Omit<CartLine, 'line_total'> & { line_total?: number }): CartLine {
  return {
    ...line,
    line_total: line.line_total ?? line.price * line.quantity,
    provider_organization_id: line.provider_organization_id ?? line.product.organization_id ?? '',
  }
}

function buildCartLine(product: Product, quantity: number): CartLine {
  return withLineTotal({
    product_id: product.id!,
    product,
    quantity,
    price: product.price,
    provider_organization_id: product.organization_id ?? '',
  })
}

function normalizeLine(line: CartLine): CartLine {
  return withLineTotal(line)
}

function computeSummary(lines: CartLine[]): CartSummary {
  return lines.reduce<CartSummary>(
    (summary, line) => ({
      itemCount: summary.itemCount + line.quantity,
      total: summary.total + line.line_total,
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
                  ? withLineTotal({
                      ...line,
                      quantity: line.quantity + quantity,
                    })
                  : line,
              ),
            }
          }
          return {
            lines: [...state.lines, buildCartLine(product, quantity)],
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
                ? withLineTotal({
                    ...line,
                    quantity: line.quantity - quantity,
                  })
                : line,
            )
            .filter((line) => line.quantity > 0),
        }))
      },

      clearCart: () => set({ lines: [] }),

      getSummary: () => computeSummary(get().lines),

      createOrder: async (input) => {
        const { lines } = get()
        if (lines.length === 0) {
          throw new Error('El carrito está vacío')
        }

        const order = await createOrderOrdersPost({
          name: input.name,
          customer_phone: input.customer_phone,
          lines: lines.map((line) => ({
            product_id: line.product_id,
            quantity: line.quantity,
            price: line.price,
          })),
        })

        set({ lines: [] })
        return order
      },
    }),
    {
      name: CART_STORAGE_KEY,
      partialize: (state) => ({ lines: state.lines }),
      merge: (persisted, current) => {
        const persistedState = persisted as CartState | undefined
        if (!persistedState?.lines) return current

        return {
          ...current,
          lines: persistedState.lines.map(normalizeLine),
        }
      },
    },
  ),
)
