import {
  getListProductsProductsProviderGetQueryKey,
  useDeleteProductProductsProviderProductIdDelete,
  useListProductsProductsProviderGet,
  type DeleteProductProductsProviderProductIdDeleteParams,
  type ListProductsProductsProviderGetParams,
  type PageProductPublic,
  type ProductPublic,
} from '@broker/api'
import {
  Button,
  DataTable,
  PageWrapper,
  useActiveOrganization,
  useCrudController,
  useListParams,
} from '@broker/ui'
import { Package, Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'

import { buildProductColumns } from './columns'
import { ProductFilters } from './filters'
import type { ProductFormValues } from './form'

const productListFilterKeys = ['name'] as const

export function ProductPage() {
  const navigate = useNavigate()
  const { activeOrganization } = useActiveOrganization()
  const list = useListParams({
    filterKeys: productListFilterKeys,
    defaultPageSize: 20,
  })

  const query = useListProductsProductsProviderGet({
    page: list.queryParams.page,
    page_size: list.queryParams.page_size,
    name: list.queryParams.name || undefined,
  } as ListProductsProductsProviderGetParams)

  const deleteMutation = useDeleteProductProductsProviderProductIdDelete()

  const crud = useCrudController<
    ProductPublic,
    ProductFormValues,
    PageProductPublic,
    never,
    never,
    {
      productId: string
      params: DeleteProductProductsProviderProductIdDeleteParams
    }
  >({
    list,
    query,
    queryKey: getListProductsProductsProviderGetQueryKey(),
    getItems: (data) => data?.items ?? [],
    getTotal: (data) => data?.total ?? 0,
    remove: {
      mutation: deleteMutation,
      toVariables: (item) => ({
        productId: item.id,
        params: {} as DeleteProductProductsProviderProductIdDeleteParams,
      }),
    },
    resetOn: [activeOrganization?.id],
  })

  const columns = useMemo(
    () =>
      buildProductColumns({
        onEdit: (row) => navigate(`/products/${row.id}`),
        onDelete: crud.remove.run,
        isDeleting: crud.remove.isPending,
      }),
    [crud.remove.isPending, crud.remove.run, navigate],
  )

  return (
    <PageWrapper
      title="Productos"
      description="Gestiona el catálogo de productos de tu organización."
      icon={Package}
      buttons={[
        <Button key="create" size="sm" className="w-full sm:w-auto" asChild>
          <Link to="/products/new">
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Link>
        </Button>,
      ]}
    >
      <div className="space-y-4">
        <ProductFilters
          filters={list.filters}
          setFilter={list.setFilter}
          onClear={list.resetFilters}
          hasActiveFilters={list.hasActiveFilters}
        />

        <DataTable
          columns={columns}
          data={crud.items}
          isLoading={crud.isLoading}
          getRowId={(row) => row.id}
          emptyMessage="No hay productos registrados"
          pagination={{
            page: list.page,
            pageSize: list.pageSize,
            total: crud.total,
            onPageChange: list.setPage,
          }}
        />
      </div>
    </PageWrapper>
  )
}

export { ProductCreatePage } from './create-page'
export { ProductEditPage } from './edit-page'
