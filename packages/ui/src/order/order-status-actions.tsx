import type { OrderItemPublic, OrderItemStatus } from '@broker/api'
import {
  getGetOrderOrdersProviderOrderIdGetQueryKey,
  getListOrdersOrdersProviderGetQueryKey,
  useUpdateItemsStatusOrdersProviderOrderIdItemsPatch,
  type GetOrderOrdersProviderOrderIdGetParams,
  type UpdateItemsStatusOrdersProviderOrderIdItemsPatchParams,
} from '@broker/api'
import { Ban } from 'lucide-react'
import { useMemo, useState } from 'react'

import { ConfirmDialog } from '../components/confirm-dialog'
import { StatusStepper } from '../components/status-stepper'
import { FieldError } from '../components/ui/field'
import { useAsyncAction } from '../crud/hooks/use-async-action'
import { useQueryCacheSync } from '../crud/hooks/use-query-cache-sync'
import { orderItemStatusLabel } from './status'

const FULFILLMENT_STEPS: { id: OrderItemStatus; label: string }[] = [
  { id: 'created', label: 'Creado' },
  { id: 'reviewed', label: 'Revisado' },
  { id: 'sent', label: 'Enviado' },
  { id: 'delivered', label: 'Entregado' },
]

const NEXT_FORWARD: Partial<Record<OrderItemStatus, OrderItemStatus>> = {
  created: 'reviewed',
  reviewed: 'sent',
  sent: 'delivered',
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
  const [cancelOpen, setCancelOpen] = useState(false)

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

  const update = useAsyncAction(
    async (status: OrderItemStatus) => {
      const result = await mutation.mutateAsync({
        orderId,
        data: { status },
        params: {} as UpdateItemsStatusOrdersProviderOrderIdItemsPatchParams,
      })
      await sync(result)
      return result
    },
    undefined,
    undefined,
    {
      success: (_result, status) =>
        status === 'canceled'
          ? 'Ítems cancelados'
          : `Estado actualizado a «${orderItemStatusLabel(status)}»`,
    },
  )

  if (items.length === 0) return null

  if (!sharedStatus) {
    return (
      <p className="text-sm text-muted-foreground">
        Los ítems tienen estados distintos; no se pueden actualizar juntos.
      </p>
    )
  }

  const isCanceled = sharedStatus === 'canceled'
  const isDelivered = sharedStatus === 'delivered'
  const canCancel = CANCELABLE.has(sharedStatus)
  const nextStatus = NEXT_FORWARD[sharedStatus]
  const currentStepId = isCanceled ? 'created' : sharedStatus
  const isCancelPending = update.isPending && cancelOpen

  const handleSelectNext = (stepId: string) => {
    if (!nextStatus || stepId !== nextStatus) return
    void update.run(nextStatus).catch(() => {})
  }

  const handleConfirmCancel = async () => {
    await update.run('canceled')
    setCancelOpen(false)
  }

  return (
    <div className="space-y-3">
      <StatusStepper
        steps={FULFILLMENT_STEPS}
        currentId={currentStepId}
        outcome={isCanceled ? 'canceled' : undefined}
        onSelectNext={nextStatus ? handleSelectNext : undefined}
        isPending={update.isPending && !cancelOpen}
        disabled={update.isPending || isCanceled || isDelivered}
        ariaLabel="Progreso de cumplimiento"
        alternateStep={
          canCancel
            ? {
                label: 'Cancelar',
                icon: Ban,
                onClick: () => setCancelOpen(true),
                disabled: update.isPending,
                isLoading: isCancelPending,
                selectLabel: 'Cancelar ítems de la orden',
              }
            : isCanceled
              ? {
                  label: 'Cancelado',
                  icon: Ban,
                  active: true,
                }
              : undefined
        }
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancelar ítems"
        description="Se cancelarán todos tus ítems de esta orden. Esta acción no se puede deshacer."
        confirmLabel="Cancelar ítems"
        cancelLabel="Volver"
        variant="destructive"
        isLoading={isCancelPending}
        onConfirm={() => {
          void handleConfirmCancel().catch(() => {})
        }}
      />

      {isCanceled ? (
        <p className="text-sm text-destructive">
          Los ítems de esta orden fueron cancelados.
        </p>
      ) : null}

      {isDelivered ? (
        <p className="text-sm text-muted-foreground">
          Cumplimiento completado. Sin acciones disponibles.
        </p>
      ) : null}

      {update.error ? <FieldError>{update.error}</FieldError> : null}
    </div>
  )
}
