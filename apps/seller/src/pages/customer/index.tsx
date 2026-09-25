import {
  getListCustomersCustomersSellerGetQueryKey,
  useListCustomersCustomersSellerGet,
  type ListCustomersCustomersSellerGetParams,
} from '@broker/api'
import {
  DataTable,
  PageWrapper,
  useActiveOrganization,
  useListParams,
  useResetOnChange,
} from '@broker/ui'
import { Contact } from 'lucide-react'
import { useMemo } from 'react'

import { buildCustomerColumns } from './columns'
import { CustomerFilters } from './filters'

export function CustomerPage() {
  const { activeOrganization } = useActiveOrganization()
  const list = useListParams({
    filterKeys: ['name', 'ci', 'phone'] as const,
    defaultPageSize: 20,
  })

  const query = useListCustomersCustomersSellerGet({
    ...list.queryParams,
  } as ListCustomersCustomersSellerGetParams)

  useResetOnChange({
    resetOnChange: [activeOrganization?.id],
    getQueryKey: () => getListCustomersCustomersSellerGetQueryKey(),
    onReset: list.resetFilters,
    setPage: list.setPage,
  })

  const columns = useMemo(() => buildCustomerColumns(), [])

  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0

  return (
    <PageWrapper
      title="Clientes"
      description="Clientes registrados en tu organización."
      icon={Contact}
    >
      <div className="space-y-4">
        <CustomerFilters
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

export { CustomerDetailPage } from './detail-page'
