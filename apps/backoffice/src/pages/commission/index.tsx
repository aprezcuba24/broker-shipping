import {
  getListCommissionsCommissionsProviderGetQueryKey,
  useListCommissionsCommissionsProviderGet,
  type ListCommissionsCommissionsProviderGetParams,
} from '@broker/api'
import {
  buildProviderCommissionColumns,
  CommissionFilters,
  DataTable,
  PageWrapper,
  useActiveOrganization,
  useListParams,
  useResetOnChange,
} from '@broker/ui'
import { CircleDollarSign } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useLinkedSellers } from '@/hooks/use-linked-sellers'

function parseIsPaidFilter(value: string | undefined): boolean | undefined {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

export function CommissionPage() {
  const { activeOrganization } = useActiveOrganization()
  const { getSellerName } = useLinkedSellers()
  const [searchParams] = useSearchParams()
  const list = useListParams({
    filterKeys: ['is_paid'] as const,
    defaultPageSize: 20,
  })
  const didInitDefault = useRef(false)

  useEffect(() => {
    if (didInitDefault.current) return
    didInitDefault.current = true
    if (!searchParams.has('is_paid')) {
      list.setFilter('is_paid', 'false')
    }
  }, [list, searchParams])

  const isPaidParam = searchParams.has('is_paid')
    ? parseIsPaidFilter(list.filters.is_paid)
    : false

  const query = useListCommissionsCommissionsProviderGet({
    page: list.queryParams.page,
    page_size: list.queryParams.page_size,
    is_paid: isPaidParam,
  } as ListCommissionsCommissionsProviderGetParams)

  useResetOnChange({
    resetOnChange: [activeOrganization?.id],
    getQueryKey: () => getListCommissionsCommissionsProviderGetQueryKey(),
    onReset: () => {
      didInitDefault.current = false
      list.resetFilters()
    },
    setPage: list.setPage,
  })

  const columns = useMemo(
    () => buildProviderCommissionColumns({ getSellerName }),
    [getSellerName],
  )

  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0
  const filterValue = searchParams.has('is_paid')
    ? list.filters.is_paid
    : 'false'

  return (
    <PageWrapper
      title="Comisiones"
      description="Comisiones pendientes de pago a vendedores."
      icon={CircleDollarSign}
    >
      <div className="space-y-4">
        <CommissionFilters
          filters={{ is_paid: filterValue }}
          setFilter={list.setFilter}
          onClear={() => list.setFilter('is_paid', 'false')}
          hasActiveFilters={filterValue !== 'false'}
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
