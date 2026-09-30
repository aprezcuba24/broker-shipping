import {
  formatApiError,
  getGetOrderOrdersProviderOrderIdGetQueryKey,
  useCreateOrderMessagingOrdersProviderOrderIdMessagingPost,
  usePatchOrderMessagingOrdersProviderOrderIdMessagingMessagingIdPatch,
  type CreateOrderMessagingOrdersProviderOrderIdMessagingPostParams,
  type GetOrderOrdersProviderOrderIdGetParams,
  type OrderPublic,
  type PatchOrderMessagingOrdersProviderOrderIdMessagingMessagingIdPatchParams,
} from '@broker/api'
import {
  Button,
  Field,
  FieldLabel,
  formatMoney,
  MoneyField,
  moneyDefault,
  notify,
  OrderMessagingSection,
} from '@broker/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

type ProviderOrderMessagingEditorProps = {
  order: OrderPublic
}

export function ProviderOrderMessagingEditor({
  order,
}: ProviderOrderMessagingEditorProps) {
  const queryClient = useQueryClient()
  const existing = order.messaging?.[0] ?? null
  const [draft, setDraft] = useState(
    () => existing?.price ?? moneyDefault(),
  )
  const [error, setError] = useState<string | null>(null)

  const createMutation =
    useCreateOrderMessagingOrdersProviderOrderIdMessagingPost()
  const patchMutation =
    usePatchOrderMessagingOrdersProviderOrderIdMessagingMessagingIdPatch()

  useEffect(() => {
    setDraft(existing?.price ?? moneyDefault())
  }, [existing?.id, existing?.price?.amount, existing?.price?.currency])

  const neighborhoodName =
    order.customer?.address?.neighborhood_name ||
    existing?.neighborhood_name ||
    'Sin barrio'
  const canAdd = Boolean(order.customer?.address?.neighborhood_id)
  const dirty = existing
    ? draft.amount !== existing.price.amount ||
      draft.currency !== existing.price.currency
    : true
  const isPending = createMutation.isPending || patchMutation.isPending

  const invalidate = async (result?: OrderPublic) => {
    const params = {} as GetOrderOrdersProviderOrderIdGetParams
    const key = getGetOrderOrdersProviderOrderIdGetQueryKey(order.id, params)
    if (result) {
      queryClient.setQueryData(key, result)
    }
    await queryClient.invalidateQueries({ queryKey: key })
  }

  const handleSave = async () => {
    setError(null)
    try {
      if (existing) {
        const updated = await patchMutation.mutateAsync({
          orderId: order.id,
          messagingId: existing.id,
          data: { price: draft },
          params:
            {} as PatchOrderMessagingOrdersProviderOrderIdMessagingMessagingIdPatchParams,
        })
        await invalidate(updated)
        notify.success('Mensajería actualizada')
      } else {
        const updated = await createMutation.mutateAsync({
          orderId: order.id,
          data: { price: draft },
          params:
            {} as CreateOrderMessagingOrdersProviderOrderIdMessagingPostParams,
        })
        await invalidate(updated)
        notify.success('Mensajería añadida')
      }
    } catch (caught) {
      setError(formatApiError(caught))
    }
  }

  return (
    <OrderMessagingSection order={order} forceShow>
      <div className="space-y-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-sm font-medium">Barrio del cliente</p>
            <p className="text-xs text-muted-foreground">{neighborhoodName}</p>
          </div>
          {existing ? (
            <p className="text-xs text-muted-foreground tabular-nums">
              Actual: {formatMoney(existing.price.amount, existing.price.currency)}
            </p>
          ) : null}
        </div>

        {!canAdd && !existing ? (
          <p className="text-sm text-muted-foreground">
            Esta orden no tiene barrio; no se puede crear la mensajería.
          </p>
        ) : (
          <>
            <Field>
              <FieldLabel htmlFor={`order-messaging-${order.id}`}>
                Precio
              </FieldLabel>
              <MoneyField
                id={`order-messaging-${order.id}`}
                value={draft}
                onValueChange={setDraft}
                disabled={isPending}
              />
            </Field>
            <Button
              size="sm"
              disabled={isPending || (existing ? !dirty : !canAdd)}
              onClick={() => void handleSave()}
            >
              {existing ? 'Guardar' : 'Añadir mensajería'}
            </Button>
          </>
        )}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </OrderMessagingSection>
  )
}
