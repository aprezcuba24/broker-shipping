import type { OrderItemPublic } from '@broker/api'

export function formatMoney(amount: string, currency: string) {
  return `${amount} ${currency.toUpperCase()}`
}

export function lineSubtotal(item: OrderItemPublic) {
  const total = Number(item.seller_provider_price) * item.quantity
  return Number.isFinite(total) ? total.toFixed(2) : '—'
}
