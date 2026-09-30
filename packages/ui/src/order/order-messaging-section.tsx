import type { OrderMessagingPublic, OrderPublic } from '@broker/api'
import type { ReactNode } from 'react'

import { formatMoney } from '../lib/utils'

export type OrderMessagingReadOnlyProps = {
  messaging: OrderMessagingPublic[]
}

export function OrderMessagingReadOnly({ messaging }: OrderMessagingReadOnlyProps) {
  if (messaging.length === 0) return null

  return (
    <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-card">
      {messaging.map((line) => (
        <li
          key={line.id}
          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm"
        >
          <div className="min-w-0 space-y-0.5">
            <p className="font-medium">
              {line.provider_organization_name || 'Proveedor'}
            </p>
            <p className="text-xs text-muted-foreground">{line.neighborhood_name}</p>
          </div>
          <p className="font-medium tabular-nums">
            {formatMoney(line.price.amount, line.price.currency)}
          </p>
        </li>
      ))}
    </ul>
  )
}

export type OrderMessagingSectionProps = {
  order: OrderPublic
  /** When set, replaces the default read-only list (provider create/edit UI). */
  children?: ReactNode
  /** Force showing the section even with no lines (provider can add). */
  forceShow?: boolean
}

export function OrderMessagingSection({
  order,
  children,
  forceShow = false,
}: OrderMessagingSectionProps) {
  const messaging = order.messaging ?? []
  if (!forceShow && !children && messaging.length === 0) return null

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium">Mensajería</h2>
      {children ?? <OrderMessagingReadOnly messaging={messaging} />}
    </div>
  )
}
