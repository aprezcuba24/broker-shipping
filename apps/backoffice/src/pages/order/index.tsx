import {
  getListOrdersOrdersProviderGetQueryKey,
  useListOrdersOrdersProviderGet,
  type ListOrdersOrdersProviderGetParams,
} from '@broker/api'
import {
  buildProviderOrderColumns,
  DataTable,
  OrderFilters,
  PageWrapper,
  useActiveOrganization,
  useListParams,
  useResetOnChange,
} from '@broker/ui'
import { ClipboardList } from 'lucide-react'
import { useMemo } from 'react'

export function OrderPage() {
  const { activeOrganization } = useActiveOrganization()
  const list = useListParams({
    filterKeys: ['search', 'status'] as const,
    defaultPageSize: 20,
  })

  const query = useListOrdersOrdersProviderGet({
    page: list.queryParams.page,
    page_size: list.queryParams.page_size,
    search: list.queryParams.search || undefined,
    status: list.queryParams.status || undefined,
  } as ListOrdersOrdersProviderGetParams)

  useResetOnChange({
    resetOnChange: [activeOrganization?.id],
    getQueryKey: () => getListOrdersOrdersProviderGetQueryKey(),
    onReset: list.resetFilters,
    setPage: list.setPage,
  })

  const columns = useMemo(() => buildProviderOrderColumns(), [])

  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0

  return (
    <PageWrapper
      title="Órdenes"
      description="Pedidos con productos de tu organización."
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
