import {
  getListOrdersOrdersSellerGetQueryKey,
  useGetCustomerCustomersSellerCustomerIdGet,
  useListOrdersOrdersSellerGet,
  type GetCustomerCustomersSellerCustomerIdGetParams,
  type ListOrdersOrdersSellerGetParams,
} from '@broker/api'
import {
  buildSellerOrderColumns,
  Button,
  DataTable,
  OrderFilters,
  PageWrapper,
  useActiveOrganization,
  useListParams,
  useResetOnChange,
} from '@broker/ui'
import { ClipboardList, X } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

export function OrderPage() {
  const { activeOrganization } = useActiveOrganization()
  const list = useListParams({
    filterKeys: ['search', 'status', 'seller_organization_id', 'customer_id'] as const,
    defaultPageSize: 20,
  })

  const customerId = list.filters.customer_id || undefined

  const customerQuery = useGetCustomerCustomersSellerCustomerIdGet(
    customerId ?? '',
    {} as GetCustomerCustomersSellerCustomerIdGetParams,
    { query: { enabled: Boolean(customerId) } },
  )

  const query = useListOrdersOrdersSellerGet({
    page: list.queryParams.page,
    page_size: list.queryParams.page_size,
    search: list.queryParams.search || undefined,
    status: list.queryParams.status || undefined,
    customer_id: customerId,
  } as ListOrdersOrdersSellerGetParams)

  useResetOnChange({
    resetOnChange: [activeOrganization?.id],
    getQueryKey: () => getListOrdersOrdersSellerGetQueryKey(),
    onReset: list.resetFilters,
    setPage: list.setPage,
  })

  const columns = useMemo(() => buildSellerOrderColumns(), [])

  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0
  const customerName = customerQuery.data?.name

  return (
    <PageWrapper
      title="Órdenes"
      description="Pedidos registrados para tu organización."
      icon={ClipboardList}
    >
      <div className="space-y-4">
        {customerId ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-surface-container-low/60 px-3 py-2 text-sm">
            <p>
              Filtrando por cliente:{' '}
              {customerName ? (
                <Link
                  to={`/customers/${customerId}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {customerName}
                </Link>
              ) : (
                <span className="font-medium">{customerId}</span>
              )}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={X}
              label="Quitar filtro"
              onClick={() => list.setFilter('customer_id', '')}
            />
          </div>
        ) : null}

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
