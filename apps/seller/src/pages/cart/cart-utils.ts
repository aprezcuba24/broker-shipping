import type { Currency, OrderCurrencyTotal, OrderItemPublic } from '@broker/api'

import type { CartItem } from '@/stores/cart-store'

export function lineSubtotal(preview: OrderItemPublic, cartQuantity: number) {
  const total = Number(preview.seller_provider_price) * cartQuantity
  return Number.isFinite(total) ? total.toFixed(2) : '—'
}

export function computeCartTotals(
  items: CartItem[],
  previewByProductId: Map<string, OrderItemPublic>,
): OrderCurrencyTotal[] {
  const amounts = new Map<Currency, number>()

  for (const item of items) {
    const preview = previewByProductId.get(item.product.id)
    if (!preview) continue
    const line = Number(preview.seller_provider_price) * item.quantity
    if (!Number.isFinite(line)) continue
    amounts.set(preview.currency, (amounts.get(preview.currency) ?? 0) + line)
  }

  return [...amounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, amount]) => ({
      currency,
      amount: amount.toFixed(2),
    }))
}
