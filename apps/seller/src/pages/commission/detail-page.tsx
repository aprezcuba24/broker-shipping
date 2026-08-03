import {
  useGetCommissionCommissionsSellerCommissionIdGet,
  type GetCommissionCommissionsSellerCommissionIdGetParams,
} from '@broker/api'
import { CommissionDetailPage as CommissionDetailView } from '@broker/ui'
import { useParams } from 'react-router-dom'

import { useLinkedProviders } from '@/hooks/use-linked-providers'

export function CommissionDetailPage() {
  const { commissionId = '' } = useParams<{ commissionId: string }>()
  const { getProviderName } = useLinkedProviders()

  const commissionQuery = useGetCommissionCommissionsSellerCommissionIdGet(
    commissionId,
    {} as GetCommissionCommissionsSellerCommissionIdGetParams,
    { query: { enabled: Boolean(commissionId) } },
  )

  return (
    <CommissionDetailView
      isLoading={!commissionId || commissionQuery.isLoading}
      isError={commissionQuery.isError}
      commission={commissionQuery.data}
      counterpartyLabel="Proveedor"
      getCounterpartyId={(commission) => commission.provider_organization_id}
      getCounterpartyName={getProviderName}
      description="Detalle de la comisión de tu organización."
    />
  )
}
