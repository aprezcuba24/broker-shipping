import type { ProductPublic } from '@broker/api'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartProductSnapshot = Pick<
  ProductPublic,
  | 'id'
  | 'name'
  | 'organization_id'
  | 'image_url'
  | 'has_commission'
  | 'price'
  | 'sale_price'
  | 'public_code'
>

export type CartItem = {
  product: CartProductSnapshot
  quantity: number
  shareCode?: string
}

type CartsByOrganization = Record<string, CartItem[]>

type CartState = {
  cartsByOrganization: CartsByOrganization
  addProduct: (
    sellerOrgId: string,
    product: CartProductSnapshot,
    shareCode?: string,
  ) => void
  addProductWithQuantity: (
    sellerOrgId: string,
    product: CartProductSnapshot,
    quantity: number,
    shareCode?: string,
  ) => void
  increment: (sellerOrgId: string, productId: string) => void
  decrement: (sellerOrgId: string, productId: string) => void
  removeProduct: (sellerOrgId: string, productId: string) => void
  clearCart: (sellerOrgId: string) => void
}

function updateItems(
  carts: CartsByOrganization,
  sellerOrgId: string,
  updater: (items: CartItem[]) => CartItem[],
): CartsByOrganization {
  const current = carts[sellerOrgId] ?? []
  return {
    ...carts,
    [sellerOrgId]: updater(current),
  }
}

function mergeShareCode(
  existing: string | undefined,
  incoming: string | undefined,
): string | undefined {
  return existing ?? incoming
}

export function getCartItems(
  cartsByOrganization: CartsByOrganization,
  sellerOrgId: string | undefined,
): CartItem[] {
  if (!sellerOrgId) return []
  return cartsByOrganization[sellerOrgId] ?? []
}

export function getCartQuantity(
  cartsByOrganization: CartsByOrganization,
  sellerOrgId: string | undefined,
  productId: string,
): number {
  if (!sellerOrgId) return 0
  const item = cartsByOrganization[sellerOrgId]?.find((i) => i.product.id === productId)
  return item?.quantity ?? 0
}

export function getCartTotalItems(
  cartsByOrganization: CartsByOrganization,
  sellerOrgId: string | undefined,
): number {
  return getCartItems(cartsByOrganization, sellerOrgId).reduce(
    (sum, item) => sum + item.quantity,
    0,
  )
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cartsByOrganization: {},

      addProduct: (sellerOrgId, product, shareCode) => {
        set((state) => ({
          cartsByOrganization: updateItems(state.cartsByOrganization, sellerOrgId, (items) => {
            const existing = items.find((i) => i.product.id === product.id)
            if (existing) {
              return items.map((i) =>
                i.product.id === product.id
                  ? {
                      ...i,
                      quantity: i.quantity + 1,
                      product,
                      shareCode: mergeShareCode(i.shareCode, shareCode),
                    }
                  : i,
              )
            }
            return [
              ...items,
              {
                product,
                quantity: 1,
                ...(shareCode ? { shareCode } : {}),
              },
            ]
          }),
        }))
      },

      addProductWithQuantity: (sellerOrgId, product, quantity, shareCode) => {
        const qty = Math.max(1, Math.floor(quantity))
        set((state) => ({
          cartsByOrganization: updateItems(state.cartsByOrganization, sellerOrgId, (items) => {
            const existing = items.find((i) => i.product.id === product.id)
            if (existing) {
              return items.map((i) =>
                i.product.id === product.id
                  ? {
                      ...i,
                      quantity: i.quantity + qty,
                      product,
                      shareCode: mergeShareCode(i.shareCode, shareCode),
                    }
                  : i,
              )
            }
            return [
              ...items,
              {
                product,
                quantity: qty,
                ...(shareCode ? { shareCode } : {}),
              },
            ]
          }),
        }))
      },

      increment: (sellerOrgId, productId) => {
        set((state) => ({
          cartsByOrganization: updateItems(state.cartsByOrganization, sellerOrgId, (items) =>
            items.map((i) =>
              i.product.id === productId ? { ...i, quantity: i.quantity + 1 } : i,
            ),
          ),
        }))
      },

      decrement: (sellerOrgId, productId) => {
        set((state) => ({
          cartsByOrganization: updateItems(state.cartsByOrganization, sellerOrgId, (items) =>
            items.map((i) =>
              i.product.id === productId
                ? { ...i, quantity: Math.max(1, i.quantity - 1) }
                : i,
            ),
          ),
        }))
      },

      removeProduct: (sellerOrgId, productId) => {
        set((state) => ({
          cartsByOrganization: updateItems(state.cartsByOrganization, sellerOrgId, (items) =>
            items.filter((i) => i.product.id !== productId),
          ),
        }))
      },

      clearCart: (sellerOrgId) => {
        set((state) => ({
          cartsByOrganization: {
            ...state.cartsByOrganization,
            [sellerOrgId]: [],
          },
        }))
      },
    }),
    {
      name: 'broker:seller:cart',
      partialize: (state) => ({ cartsByOrganization: state.cartsByOrganization }),
    },
  ),
)
