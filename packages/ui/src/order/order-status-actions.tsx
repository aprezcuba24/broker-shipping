import type { OrderItemPublic, OrderItemStatus } from '@broker/api'
import {
  getGetOrderOrdersProviderOrderIdGetQueryKey,
  getListOrdersOrdersProviderGetQueryKey,
  useUpdateItemsStatusOrdersProviderOrderIdItemsPatch,
  type GetOrderOrdersProviderOrderIdGetParams,
  type UpdateItemsStatusOrdersProviderOrderIdItemsPatchParams,
} from '@broker/api'
import { useMemo } from 'react'

import { BtnConfirm } from '../components/btn-confirm'
import { Button } from '../components/button'
import { FieldError } from '../components/ui/field'
import { useAsyncAction } from '../crud/hooks/use-async-action'
import { useQueryCacheSync } from '../crud/hooks/use-query-cache-sync'
import { orderItemStatusLabel } from './status'

const NEXT_FORWARD: Partial<Record<OrderItemStatus, OrderItemStatus>> = {
  created: 'reviewed',
  reviewed: 'sent',
  sent: 'delivered',
}

const FORWARD_LABEL: Partial<Record<OrderItemStatus, string>> = {
  reviewed: 'Marcar como revisada',
  sent: 'Marcar como enviada',
  delivered: 'Marcar como entregada',
}

const CANCELABLE: ReadonlySet<OrderItemStatus> = new Set([
  'created',
  'reviewed',
  'sent',
])

export type OrderStatusActionsProps = {
  orderId: string
  items: OrderItemPublic[]
}

export function OrderStatusActions({ orderId, items }: OrderStatusActionsProps) {
  const statuses = useMemo(
    () => [...new Set(items.map((item) => item.status))],
    [items],
  )
  const sharedStatus = statuses.length === 1 ? statuses[0] : null

  const detailParams = {} as GetOrderOrdersProviderOrderIdGetParams
  const detailQueryKey = getGetOrderOrdersProviderOrderIdGetQueryKey(
    orderId,
    detailParams,
  )
  const { sync } = useQueryCacheSync({
    detailQueryKey,
    invalidateKeys: [
      getListOrdersOrdersProviderGetQueryKey(),
      detailQueryKey,
    ],
  })

  const mutation = useUpdateItemsStatusOrdersProviderOrderIdItemsPatch()

  const update = useAsyncAction(async (status: OrderItemStatus) => {
    const result = await mutation.mutateAsync({
      orderId,
      data: { status },
      params: {} as UpdateItemsStatusOrdersProviderOrderIdItemsPatchParams,
    })
    await sync(result)
    return result
  })

  if (items.length === 0) return null

  if (!sharedStatus) {
    return (
      <p className="text-sm text-muted-foreground">
        Los ítems tienen estados distintos; no se pueden actualizar juntos.
      </p>
    )
  }

  const nextStatus = NEXT_FORWARD[sharedStatus]
  const canCancel = CANCELABLE.has(sharedStatus)

  if (!nextStatus && !canCancel) {
    return (
      <p className="text-sm text-muted-foreground">
        Estado actual: {orderItemStatusLabel(sharedStatus)}. Sin acciones
        disponibles.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {nextStatus ? (
          <Button
            size="sm"
            disabled={update.isPending}
            onClick={() => void update.run(nextStatus).catch(() => {})}
          >
            {FORWARD_LABEL[nextStatus]}
          </Button>
        ) : null}
        {canCancel ? (
          <BtnConfirm
            size="sm"
            variant="destructive"
            confirmVariant="destructive"
            disabled={update.isPending}
            isLoading={update.isPending}
            title="Cancelar ítems"
            description="Se cancelarán todos tus ítems de esta orden. Esta acción no se puede deshacer."
            confirmLabel="Cancelar ítems"
            cancelLabel="Volver"
            onConfirm={async () => {
              await update.run('canceled')
            }}
          >
            Cancelar
          </BtnConfirm>
        ) : null}
      </div>
      {update.error ? <FieldError>{update.error}</FieldError> : null}
    </div>
  )
}
