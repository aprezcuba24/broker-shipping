import {
  getListMovementsProductStockMovementsProviderGetQueryKey,
  StockMovementKind,
  useListMovementsProductStockMovementsProviderGet,
  type ListMovementsProductStockMovementsProviderGetParams,
  type StockMovementKind as StockMovementKindType,
} from '@broker/api'
import {
  BtnLink,
  DataTable,
  PageWrapper,
  useActiveOrganization,
  useListParams,
  useResetOnChange,
} from '@broker/ui'
import { Boxes, Plus } from 'lucide-react'
import { useMemo } from 'react'

import { buildStockMovementColumns } from './columns'
import { StockMovementFilters } from './filters'

function parseKindFilter(
  value: string | undefined,
): StockMovementKindType | undefined {
  if (
    value === StockMovementKind.reception ||
    value === StockMovementKind.shrinkage ||
    value === StockMovementKind.correction
  ) {
    return value
  }
  return undefined
}

export function StockMovementPage() {
  const { activeOrganization } = useActiveOrganization()
  const list = useListParams({
    filterKeys: ['kind'] as const,
    defaultPageSize: 20,
  })

  const query = useListMovementsProductStockMovementsProviderGet({
    page: list.queryParams.page,
    page_size: list.queryParams.page_size,
    kind: parseKindFilter(list.queryParams.kind),
  } as ListMovementsProductStockMovementsProviderGetParams)

  useResetOnChange({
    resetOnChange: [activeOrganization?.id],
    getQueryKey: () => getListMovementsProductStockMovementsProviderGetQueryKey(),
    onReset: () => list.resetFilters(),
    setPage: list.setPage,
  })

  const columns = useMemo(() => buildStockMovementColumns(), [])
  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0

  return (
    <PageWrapper
      title="Inventario"
      description="Movimientos de stock: recepciones, mermas y correcciones."
      icon={Boxes}
      buttons={[
        <BtnLink key="create" to="/inventory/new" icon={Plus}>
          Nuevo movimiento
        </BtnLink>,
      ]}
    >
      <div className="space-y-4">
        <StockMovementFilters
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

export { StockMovementCreatePage } from './create-page'
export { StockMovementDetailPage } from './detail-page'
