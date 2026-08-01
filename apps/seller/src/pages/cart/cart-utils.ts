import type { Currency, OrderCurrencyTotal, OrderItemPublic } from '@broker/api'

import type { CartItem } from '@/stores/cart-store'

export function lineSubtotal(preview: OrderItemPublic, cartQuantity: number): number {
  return preview.seller_provider_price * cartQuantity
}

export function computeCartTotals(
  items: CartItem[],
  previewByProductId: Map<string, OrderItemPublic>,
): OrderCurrencyTotal[] {
  const amounts = new Map<Currency, number>()

  for (const item of items) {
    const preview = previewByProductId.get(item.product.id)
    if (!preview) continue
    const line = preview.seller_provider_price * item.quantity
    amounts.set(preview.currency, (amounts.get(preview.currency) ?? 0) + line)
  }

  return [...amounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, amount]) => ({
      currency,
      amount,
    }))
}
