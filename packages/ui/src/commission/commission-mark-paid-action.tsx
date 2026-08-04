import type { CommissionPublic } from '@broker/api'
import {
  getGetCommissionCommissionsProviderCommissionIdGetQueryKey,
  getListCommissionsCommissionsProviderGetQueryKey,
  useMarkCommissionPaidCommissionsProviderCommissionIdPatch,
  type GetCommissionCommissionsProviderCommissionIdGetParams,
  type MarkCommissionPaidCommissionsProviderCommissionIdPatchParams,
} from '@broker/api'

import { BtnConfirm } from '../components/btn-confirm'
import { FieldError } from '../components/ui/field'
import { useAsyncAction } from '../crud/hooks/use-async-action'
import { useQueryCacheSync } from '../crud/hooks/use-query-cache-sync'

export type CommissionMarkPaidActionProps = {
  commission: CommissionPublic
}

export function CommissionMarkPaidAction({
  commission,
}: CommissionMarkPaidActionProps) {
  const detailParams = {} as GetCommissionCommissionsProviderCommissionIdGetParams
  const detailQueryKey = getGetCommissionCommissionsProviderCommissionIdGetQueryKey(
    commission.id,
    detailParams,
  )
  const { sync } = useQueryCacheSync({
    detailQueryKey,
    invalidateKeys: [
      getListCommissionsCommissionsProviderGetQueryKey(),
      detailQueryKey,
    ],
  })

  const mutation = useMarkCommissionPaidCommissionsProviderCommissionIdPatch()

  const markPaid = useAsyncAction(async () => {
    const result = await mutation.mutateAsync({
      commissionId: commission.id,
      data: {},
      params: {} as MarkCommissionPaidCommissionsProviderCommissionIdPatchParams,
    })
    await sync(result)
    return result
  })

  if (commission.is_paid) {
    return (
      <p className="text-sm text-muted-foreground">Esta comisión ya está pagada.</p>
    )
  }

  return (
    <div className="space-y-3">
      <BtnConfirm
        size="sm"
        disabled={markPaid.isPending}
        isLoading={markPaid.isPending}
        title="Marcar como pagada"
        description="¿Marcar esta comisión como pagada? Esta acción no se puede deshacer."
        confirmLabel="Marcar pagada"
        cancelLabel="Volver"
        onConfirm={async () => {
          await markPaid.run()
        }}
      >
        Marcar como pagada
      </BtnConfirm>
      {markPaid.error ? <FieldError>{markPaid.error}</FieldError> : null}
    </div>
  )
}
