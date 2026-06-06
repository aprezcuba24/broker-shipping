import { DataTable, PageWrapper } from '@broker/ui'
import { Package } from 'lucide-react'
import { columns } from './columns'
import { ProductFilters } from './filter'
import { useProducts } from './products-context'

export function ProductTable() {
  const { items, isLoading, page, setPage } = useProducts()

  return (
    <PageWrapper
      title="Catálogo"
      description="Consulta los productos de tus proveedores vinculados."
      icon={Package}
    >
      <ProductFilters />
      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        getRowId={(row) => row.id!}
        pagination={{ page, onPageChange: setPage }}
        emptyMessage="No hay productos disponibles"
      />
    </PageWrapper>
  )
}
