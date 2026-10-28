import type { StorefrontCheckoutPublic } from '@broker/api'
import { formatMoney } from '@broker/ui'

import { WHATSAPP_PHONE } from '@/config/env'

export type CheckoutFormValues = {
  name: string
  ci: string
  phone: string
  address: string
  province_id: string
  municipality_id: string
}

export type CompletedCheckout = {
  order: StorefrontCheckoutPublic
  values: CheckoutFormValues
}

export function buildWhatsAppUrl(completed: CompletedCheckout): string {
  const { order, values } = completed
  const lines = [
    `Hola, acabo de pedir en la librería.`,
    `Pedido: ${order.code}`,
    '',
    'Libros:',
    ...order.items.map(
      (item) =>
        `· ${item.product_name} × ${item.quantity} — ${formatMoney(item.line_total)}`,
    ),
    '',
    `Total: ${(order.totals ?? []).map((money) => formatMoney(money)).join(' + ')}`,
    '',
    `Nombre: ${values.name}`,
    `Teléfono: ${values.phone}`,
    `CI: ${values.ci}`,
    `Dirección: ${values.address}`,
    '',
    'Pago al recibir los libros.',
  ]
  const text = encodeURIComponent(lines.join('\n'))
  const phone = WHATSAPP_PHONE.replace(/\D/g, '')
  return `https://wa.me/${phone}?text=${text}`
}
