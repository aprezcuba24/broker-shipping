import {
  getListProductsProductsSellerGetQueryKey,
  useListProductsProductsSellerGet,
  type ListProductsProductsSellerGetParams,
} from '@broker/api'
import {
  DataTable,
  PageWrapper,
  useActiveOrganization,
  useListParams,
  useResetOnChange,
} from '@broker/ui'
import { Package } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { useLinkedProviders } from '@/hooks/use-linked-providers'
import { buildProductColumns } from './columns'
import { ProductFilters } from './filters'

export function ProductPage() {
  const navigate = useNavigate()
  const { activeOrganization } = useActiveOrganization()
  const list = useListParams({
    filterKeys: ['name', 'provider_id'] as const,
    defaultPageSize: 20,
  })

  const { providers, providerNameById, isLoading: providersLoading } =
    useLinkedProviders()

  const query = useListProductsProductsSellerGet({
    ...list.queryParams,
  } as ListProductsProductsSellerGetParams)

  useResetOnChange({
    resetOnChange: [activeOrganization?.id],
    getQueryKey: () => getListProductsProductsSellerGetQueryKey(),
    onReset: list.resetFilters,
    setPage: list.setPage,
  })

  const columns = useMemo(
    () =>
      buildProductColumns({
        providerNameById,
        onView: (row) => navigate(`/products/${row.id}`),
      }),
    [navigate, providerNameById],
  )

  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0

  return (
    <PageWrapper
      title="Productos"
      description="Catálogo de productos de tus proveedores vinculados."
      icon={Package}
    >
      <div className="space-y-4">
        <ProductFilters
          filters={list.filters}
          setFilter={list.setFilter}
          onClear={list.resetFilters}
          hasActiveFilters={list.hasActiveFilters}
          providers={providers}
          providersLoading={providersLoading}
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

export { ProductDetailPage } from './detail-page'
