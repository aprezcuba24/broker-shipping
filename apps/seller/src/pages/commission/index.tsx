import {
  getListCommissionsCommissionsSellerGetQueryKey,
  useListCommissionsCommissionsSellerGet,
  type ListCommissionsCommissionsSellerGetParams,
} from '@broker/api'
import {
  buildSellerCommissionColumns,
  CommissionFilters,
  DataTable,
  PageWrapper,
  useActiveOrganization,
  useListParams,
  useResetOnChange,
} from '@broker/ui'
import { CircleDollarSign } from 'lucide-react'
import { useMemo } from 'react'

import { useLinkedProviders } from '@/hooks/use-linked-providers'

function parseIsPaidFilter(value: string | undefined): boolean | undefined {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

export function CommissionPage() {
  const { activeOrganization } = useActiveOrganization()
  const { getProviderName } = useLinkedProviders()
  const list = useListParams({
    filterKeys: ['is_paid'] as const,
    defaultPageSize: 20,
  })

  const query = useListCommissionsCommissionsSellerGet({
    page: list.queryParams.page,
    page_size: list.queryParams.page_size,
    is_paid: parseIsPaidFilter(list.queryParams.is_paid),
  } as ListCommissionsCommissionsSellerGetParams)

  useResetOnChange({
    resetOnChange: [activeOrganization?.id],
    getQueryKey: () => getListCommissionsCommissionsSellerGetQueryKey(),
    onReset: list.resetFilters,
    setPage: list.setPage,
  })

  const columns = useMemo(
    () => buildSellerCommissionColumns({ getProviderName }),
    [getProviderName],
  )

  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0

  return (
    <PageWrapper
      title="Comisiones"
      description="Comisiones generadas por tus pedidos entregados."
      icon={CircleDollarSign}
    >
      <div className="space-y-4">
        <CommissionFilters
          filters={list.filters}
          setFilter={list.setFilter}
          onClear={list.resetFilters}
          hasActiveFilters={list.hasActiveFilters}
        />

        <DataTable
          columns={columns}
          data={items}
          isLoading={query.isLoading}
          getRowId={(row) => row.id}
          pagination={{
            page: list.page,
            pageSize: list.pageSize,
            total,
            onPageChange: list.setPage,
          }}
        />
      </div>
    </PageWrapper>
  )
}

export { CommissionDetailPage } from './detail-page'
