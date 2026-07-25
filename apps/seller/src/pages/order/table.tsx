import { DataTable, PageWrapper } from '@broker/ui'
import { ClipboardList } from 'lucide-react'
import { columns } from './columns'
import { OrderFilters } from './filter'
import { useOrders } from './orders-context'

export function OrderTable() {
  const { items, isLoading, page, setPage } = useOrders()

  return (
    <PageWrapper
      title="Órdenes"
      description="Consulta y gestiona las órdenes de tu organización."
      icon={ClipboardList}
    >
      <OrderFilters />
      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        pagination={{ page, onPageChange: setPage }}
        emptyMessage="No hay órdenes registradas"
      />
    </PageWrapper>
  )
}
