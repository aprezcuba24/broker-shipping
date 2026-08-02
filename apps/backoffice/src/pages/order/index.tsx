import {
  getListOrdersOrdersProviderGetQueryKey,
  useListOrdersOrdersProviderGet,
  type ListOrdersOrdersProviderGetParams,
} from '@broker/api'
import {
  buildProviderOrderColumns,
  DataTable,
  PageWrapper,
  useActiveOrganization,
  useListParams,
  useResetOnChange,
} from '@broker/ui'
import { ClipboardList } from 'lucide-react'
import { useMemo } from 'react'

export function OrderPage() {
  const { activeOrganization } = useActiveOrganization()
  const list = useListParams({ defaultPageSize: 20 })

  const query = useListOrdersOrdersProviderGet({
    page: list.queryParams.page,
    page_size: list.queryParams.page_size,
  } as ListOrdersOrdersProviderGetParams)

  useResetOnChange({
    resetOnChange: [activeOrganization?.id],
    getQueryKey: () => getListOrdersOrdersProviderGetQueryKey(),
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
    </PageWrapper>
  )
}

export { OrderDetailPage } from './detail-page'
