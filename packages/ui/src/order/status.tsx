import type { OrderItemStatus, OrderStatus } from '@broker/api'

import { Badge } from '../components/ui/badge'

export type OrderBadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive'

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  created: 'Creada',
  processing: 'En proceso',
  finished: 'Finalizada',
  canceled: 'Cancelada',
}

export const ORDER_STATUS_VARIANT: Record<OrderStatus, OrderBadgeVariant> = {
  created: 'secondary',
  processing: 'default',
  finished: 'outline',
  canceled: 'destructive',
}

export const ORDER_ITEM_STATUS_LABEL: Record<OrderItemStatus, string> = {
  created: 'Creado',
  reviewed: 'Revisado',
  sent: 'Enviado',
  delivered: 'Entregado',
  canceled: 'Cancelado',
}

export const ORDER_ITEM_STATUS_VARIANT: Record<OrderItemStatus, OrderBadgeVariant> = {
  created: 'secondary',
  reviewed: 'default',
  sent: 'default',
  delivered: 'outline',
  canceled: 'destructive',
}

export const ORDER_STATUS_FILTER_OPTIONS: { id: OrderStatus; name: string }[] = [
  { id: 'created', name: ORDER_STATUS_LABEL.created },
  { id: 'processing', name: ORDER_STATUS_LABEL.processing },
  { id: 'finished', name: ORDER_STATUS_LABEL.finished },
  { id: 'canceled', name: ORDER_STATUS_LABEL.canceled },
]

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABEL[status] ?? status
}

export function orderStatusVariant(status: OrderStatus): OrderBadgeVariant {
  return ORDER_STATUS_VARIANT[status]
}

export function orderItemStatusLabel(status: OrderItemStatus): string {
  return ORDER_ITEM_STATUS_LABEL[status] ?? status
}

export function orderItemStatusVariant(status: OrderItemStatus): OrderBadgeVariant {
  return ORDER_ITEM_STATUS_VARIANT[status]
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={orderStatusVariant(status)}>{orderStatusLabel(status)}</Badge>
}

export function OrderItemStatusBadge({ status }: { status: OrderItemStatus }) {
  return (
    <Badge variant={orderItemStatusVariant(status)}>{orderItemStatusLabel(status)}</Badge>
  )
}
