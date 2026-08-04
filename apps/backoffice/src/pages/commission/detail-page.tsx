import {
  useGetCommissionCommissionsProviderCommissionIdGet,
  type GetCommissionCommissionsProviderCommissionIdGetParams,
} from '@broker/api'
import {
  CommissionDetailPage as CommissionDetailView,
  CommissionMarkPaidAction,
} from '@broker/ui'
import { useParams } from 'react-router-dom'

import { useLinkedSellers } from '@/hooks/use-linked-sellers'

export function CommissionDetailPage() {
  const { commissionId = '' } = useParams<{ commissionId: string }>()
  const { getSellerName } = useLinkedSellers()

  const commissionQuery = useGetCommissionCommissionsProviderCommissionIdGet(
    commissionId,
    {} as GetCommissionCommissionsProviderCommissionIdGetParams,
    { query: { enabled: Boolean(commissionId) } },
  )

  const commission = commissionQuery.data

  return (
    <CommissionDetailView
      isLoading={!commissionId || commissionQuery.isLoading}
      isError={commissionQuery.isError}
      commission={commission}
      counterpartyLabel="Vendedor"
      getCounterpartyId={(row) => row.seller_organization_id}
      getCounterpartyName={getSellerName}
      description="Detalle de la comisión a pagar."
    >
      {commission ? (
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Acciones</h2>
          <CommissionMarkPaidAction commission={commission} />
        </div>
      ) : null}
    </CommissionDetailView>
  )
}
