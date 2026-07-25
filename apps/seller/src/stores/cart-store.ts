import type { Product } from '@broker/api'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const CART_STORAGE_KEY = 'broker:seller:carts'

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

type CartsByOrganizationId = Record<string, CartLine[]>

interface CartState {
  activeOrganizationId: string | null
  cartsByOrganizationId: CartsByOrganizationId
  lines: CartLine[]
}

interface CartActions {
  setActiveOrganizationId: (organizationId: string | null) => void
  addProduct: (product: Product, quantity?: number) => void
  removeProduct: (productId: string) => void
  decreaseQuantity: (productId: string, quantity?: number) => void
  clearCart: () => void
  getSummary: () => CartSummary
}

export type CartStore = CartState & CartActions

type PersistedCartState = Pick<CartState, 'cartsByOrganizationId'>

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

function getOrgLines(carts: CartsByOrganizationId, orgId: string | null): CartLine[] {
  if (!orgId) return []
  return carts[orgId] ?? []
}

function normalizeCarts(carts: CartsByOrganizationId): CartsByOrganizationId {
  return Object.fromEntries(
    Object.entries(carts).map(([orgId, lines]) => [orgId, lines.map(normalizeLine)]),
  )
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
      activeOrganizationId: null,
      cartsByOrganizationId: {},
      lines: [],

      setActiveOrganizationId: (organizationId) => {
        set((state) => ({
          activeOrganizationId: organizationId,
          lines: getOrgLines(state.cartsByOrganizationId, organizationId),
        }))
      },

      addProduct: (product, quantity = 1) => {
        const orgId = get().activeOrganizationId
        const productId = product.id
        if (!orgId || !productId || quantity <= 0) return

        set((state) => {
          const currentLines = state.cartsByOrganizationId[orgId] ?? []
          const existing = currentLines.find((line) => line.product_id === productId)
          const nextLines = existing
            ? currentLines.map((line) =>
                line.product_id === productId
                  ? withLineTotal({
                      ...line,
                      quantity: line.quantity + quantity,
                    })
                  : line,
              )
            : [...currentLines, buildCartLine(product, quantity)]

          const cartsByOrganizationId = {
            ...state.cartsByOrganizationId,
            [orgId]: nextLines,
          }

          return {
            cartsByOrganizationId,
            lines: nextLines,
          }
        })
      },

      removeProduct: (productId) => {
        const orgId = get().activeOrganizationId
        if (!orgId) return

        set((state) => {
          const nextLines = (state.cartsByOrganizationId[orgId] ?? []).filter(
            (line) => line.product_id !== productId,
          )
          const cartsByOrganizationId = {
            ...state.cartsByOrganizationId,
            [orgId]: nextLines,
          }

          return {
            cartsByOrganizationId,
            lines: nextLines,
          }
        })
      },

      decreaseQuantity: (productId, quantity = 1) => {
        const orgId = get().activeOrganizationId
        if (!orgId || quantity <= 0) return

        set((state) => {
          const nextLines = (state.cartsByOrganizationId[orgId] ?? [])
            .map((line) =>
              line.product_id === productId
                ? withLineTotal({
                    ...line,
                    quantity: line.quantity - quantity,
                  })
                : line,
            )
            .filter((line) => line.quantity > 0)

          const cartsByOrganizationId = {
            ...state.cartsByOrganizationId,
            [orgId]: nextLines,
          }

          return {
            cartsByOrganizationId,
            lines: nextLines,
          }
        })
      },

      clearCart: () => {
        const orgId = get().activeOrganizationId
        if (!orgId) return

        set((state) => ({
          cartsByOrganizationId: {
            ...state.cartsByOrganizationId,
            [orgId]: [],
          },
          lines: [],
        }))
      },

      getSummary: () => computeSummary(get().lines),
    }),
    {
      name: CART_STORAGE_KEY,
      partialize: (state): PersistedCartState => ({
        cartsByOrganizationId: state.cartsByOrganizationId,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as PersistedCartState | undefined
        if (!persistedState?.cartsByOrganizationId) return current

        return {
          ...current,
          cartsByOrganizationId: normalizeCarts(persistedState.cartsByOrganizationId),
        }
      },
    },
  ),
)
