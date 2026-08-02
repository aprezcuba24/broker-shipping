import {
  formatDateTime,
  useGetOrderOrdersSellerOrderIdGet,
  type GetOrderOrdersSellerOrderIdGetParams,
} from '@broker/api'
import {
  Badge,
  BtnLink,
  formatMoney,
  PageLoading,
  PageMessage,
  PageWrapper,
} from '@broker/ui'
import { ArrowLeft, ClipboardList } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { orderStatusLabel } from './columns'
import { OrderItemsTable } from './order-items-table'

export function OrderDetailPage() {
  const { orderId = '' } = useParams<{ orderId: string }>()

  const orderQuery = useGetOrderOrdersSellerOrderIdGet(
    orderId,
    {} as GetOrderOrdersSellerOrderIdGetParams,
    { query: { enabled: Boolean(orderId) } },
  )

  if (!orderId || orderQuery.isLoading) {
    return <PageLoading title="Orden" />
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <PageMessage
        title="Orden no encontrada"
        message="No se pudo cargar la orden solicitada."
        icon={ClipboardList}
        backTo="/orders"
      />
    )
  }

  const order = orderQuery.data
  const customer = order.customer

  return (
    <PageWrapper
      title={order.code}
      description="Detalle de la orden."
      icon={ClipboardList}
      leading={
        <BtnLink
          to="/orders"
          variant="outline"
          size="icon-sm"
          icon={ArrowLeft}
          aria-label="Volver a órdenes"
        />
      }
    >
      <div className="space-y-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">Código</dt>
            <dd className="text-sm">{order.code}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">Estado</dt>
            <dd>
              <Badge>{orderStatusLabel(order.status)}</Badge>
            </dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">Cliente</dt>
            <dd className="text-sm">{customer?.name ?? '—'}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">Teléfono</dt>
            <dd className="text-sm">{customer?.phone ?? '—'}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">CI</dt>
            <dd className="text-sm">{customer?.ci ?? '—'}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">Dirección</dt>
            <dd className="text-sm">{customer?.address?.address ?? '—'}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">Creada</dt>
            <dd className="text-sm">{formatDateTime(order.created_at)}</dd>
          </div>
          <div className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">Totales</dt>
            <dd className="space-y-0.5 text-sm font-medium tabular-nums">
              {(order.totals ?? []).length > 0
                ? (order.totals ?? []).map((total) => (
                    <div key={total.currency}>
                      {formatMoney(total.amount, total.currency)}
                    </div>
                  ))
                : '—'}
            </dd>
          </div>
        </dl>

        <div className="space-y-2">
          <h2 className="text-sm font-medium">Ítems</h2>
          <OrderItemsTable items={order.items ?? []} />
        </div>
      </div>
    </PageWrapper>
  )
}
