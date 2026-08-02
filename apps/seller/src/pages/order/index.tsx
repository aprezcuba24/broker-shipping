import {
  getListOrdersOrdersSellerGetQueryKey,
  useListOrdersOrdersSellerGet,
  type ListOrdersOrdersSellerGetParams,
} from '@broker/api'
import {
  DataTable,
  PageWrapper,
  useActiveOrganization,
  useListParams,
  useResetOnChange,
} from '@broker/ui'
import { ClipboardList } from 'lucide-react'
import { useMemo } from 'react'

import { buildOrderColumns } from './columns'
import { OrderFilters } from './filters'

export function OrderPage() {
  const { activeOrganization } = useActiveOrganization()
  const list = useListParams({
    filterKeys: ['search'] as const,
    defaultPageSize: 20,
  })

  const query = useListOrdersOrdersSellerGet({
    ...list.queryParams,
  } as ListOrdersOrdersSellerGetParams)

  useResetOnChange({
    resetOnChange: [activeOrganization?.id],
    getQueryKey: () => getListOrdersOrdersSellerGetQueryKey(),
    onReset: list.resetFilters,
    setPage: list.setPage,
  })

  const columns = useMemo(() => buildOrderColumns(), [])

  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0

  return (
    <PageWrapper
      title="Órdenes"
      description="Pedidos registrados para tu organización."
      icon={ClipboardList}
    >
      <div className="space-y-4">
        <OrderFilters
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

export { OrderDetailPage } from './detail-page'
