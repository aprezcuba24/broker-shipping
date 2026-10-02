import {
  formatAddressLine,
  formatDateTime,
  type OrderItemPublic,
  type OrderMessagingPublic,
  type OrderPublic,
} from '@broker/api'

import { formatMoney, formatSellerCommissions } from '../lib/utils'

function productLine(item: OrderItemPublic): string {
  const name = item.product_name?.trim() || '—'
  const qty = item.quantity > 1 ? ` × ${item.quantity}` : ''
  return `🛒 Producto: ${name}${qty}`
}

function formatItemBlock(item: OrderItemPublic): string {
  return [
    productLine(item),
    `💵 Precio de tienda: ${formatMoney(item.unit_provider_price)}`,
    `💶 Precio del gestor: ${formatMoney(item.seller_provider_price)}`,
    `💱 Moneda: ${item.seller_provider_price.currency.toUpperCase()}`,
    `💰 Comisión: ${formatSellerCommissions(item)}`,
  ].join('\n')
}

function formatMessagingLine(line: OrderMessagingPublic): string {
  const parts = [formatMoney(line.price)]
  if (line.neighborhood_name?.trim()) {
    parts.push(line.neighborhood_name.trim())
  }
  return `🚚 Mensajería: ${parts.join(' · ')}`
}

/** Plain-text snapshot of an order for clipboard / messaging paste. */
export function formatOrderClipboardText(order: OrderPublic): string {
  const customer = order.customer
  const header = [
    `🧿 FECHA: ${formatDateTime(order.created_at)}`,
    `🍀 Nombre del gestor: ${order.seller_organization?.name?.trim() || '—'}`,
    `📌 Nombre del cliente: ${customer?.name?.trim() || '—'}`,
    `🪪 Carnet de identidad: ${customer?.ci?.trim() || '—'}`,
    `📱 Teléfono del cliente: ${customer?.phone?.trim() || '—'}`,
    `🚛 Dirección de entrega: ${formatAddressLine(customer?.address)}`,
  ]

  const items = order.items ?? []
  const itemBlocks =
    items.length > 0 ? items.map(formatItemBlock) : ['🛒 Producto: —']

  const messaging = (order.messaging ?? []).map(formatMessagingLine)

  const sections = [header.join('\n'), ...itemBlocks]
  if (messaging.length > 0) {
    sections.push(messaging.join('\n'))
  }

  return sections.join('\n\n')
}
