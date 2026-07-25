import { OrderLineStatus, OrderStatus } from '@broker/api'

const orderStatusLabels: Record<OrderStatus, string> = {
  created: 'Creada',
  processing: 'En proceso',
  canceled: 'Cancelada',
  finished: 'Finalizada',
}

const orderLineStatusLabels: Record<OrderLineStatus, string> = {
  created: 'Creada',
  accepted: 'Aceptada',
  processed: 'Procesada',
  shipped: 'Enviada',
  delivered: 'Entregada',
  canceled: 'Cancelada',
}

export function formatOrderStatus(status: OrderStatus): string {
  return orderStatusLabels[status] ?? status
}

export function formatOrderLineStatus(status: OrderLineStatus): string {
  return orderLineStatusLabels[status] ?? status
}

export function formatSnapshotValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

export function snapshotString(
  snapshot: { [key: string]: unknown },
  key: string,
): string {
  const value = snapshot[key]
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}
