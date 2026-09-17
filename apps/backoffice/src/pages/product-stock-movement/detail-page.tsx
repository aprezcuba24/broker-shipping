import {
  formatDateTime,
  getProductProductsProviderProductIdGet,
  useGetMovementProductStockMovementsProviderMovementIdGet,
  type GetMovementProductStockMovementsProviderMovementIdGetParams,
  type GetProductProductsProviderProductIdGetParams,
  type ProductStockMovementItemPublic,
  type ProductStockMovementPublic,
} from '@broker/api'
import {
  Badge,
  BtnLink,
  componentColumn,
  DataTable,
  DetailSection,
  numberColumn,
  PageLoading,
  PageMessage,
  PageWrapper,
  type ColumnDef,
  type DetailSectionField,
} from '@broker/ui'
import { ArrowLeft, Boxes } from 'lucide-react'
import { useQueries } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'

import {
  stockMovementDirectionLabel,
  stockMovementKindLabel,
} from './labels'

const movementSummaryFields: DetailSectionField<ProductStockMovementPublic>[] = [
  {
    title: 'Tipo',
    accessor: (movement) => movement.kind,
    format: (value) => (
      <Badge variant="secondary">
        {stockMovementKindLabel(value as ProductStockMovementPublic['kind'])}
      </Badge>
    ),
  },
  {
    title: 'Dirección',
    accessor: (movement) => movement.direction,
    format: (value) => (
      <Badge variant="outline">
        {stockMovementDirectionLabel(
          value as ProductStockMovementPublic['direction'],
        )}
      </Badge>
    ),
  },
  {
    title: 'Fecha',
    accessor: (movement) => movement.moved_at,
    format: (value) => formatDateTime(value as string),
  },
  {
    title: 'Notas',
    accessor: (movement) => movement.notes,
    fullWidth: true,
    format: (value) => {
      const notes = typeof value === 'string' ? value.trim() : ''
      return notes || '—'
    },
  },
  {
    title: 'Creado',
    accessor: (movement) => movement.created_at,
    format: (value) => formatDateTime(value as string),
  },
]

function buildItemColumns(
  getProductName: (productId: string) => string,
): ColumnDef<ProductStockMovementItemPublic>[] {
  return [
    componentColumn<ProductStockMovementItemPublic>('product', 'Producto', (row) => (
      <span>{getProductName(row.product_id)}</span>
    )),
    numberColumn<ProductStockMovementItemPublic>({
      id: 'quantity',
      header: 'Cantidad',
    }),
  ]
}

export function StockMovementDetailPage() {
  const { movementId = '' } = useParams<{ movementId: string }>()

  const movementQuery = useGetMovementProductStockMovementsProviderMovementIdGet(
    movementId,
    {} as GetMovementProductStockMovementsProviderMovementIdGetParams,
    { query: { enabled: Boolean(movementId) } },
  )

  const movement = movementQuery.data
  const items = movement?.items ?? []

  const productIds = useMemo(
    () => [...new Set(items.map((item) => item.product_id))],
    [items],
  )

  const fetchProduct = useCallback(
    (productId: string, signal?: AbortSignal) =>
      getProductProductsProviderProductIdGet(
        productId,
        {} as GetProductProductsProviderProductIdGetParams,
        undefined,
        signal,
      ),
    [],
  )

  const productQueries = useQueries({
    queries: productIds.map((productId) => ({
      queryKey: ['provider-product-name', productId],
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        fetchProduct(productId, signal),
      enabled: Boolean(productId),
      staleTime: 60_000,
    })),
  })

  const nameByProductId = useMemo(() => {
    const map = new Map<string, string>()
    productIds.forEach((productId, index) => {
      const data = productQueries[index]?.data
      if (data) map.set(productId, data.name)
    })
    return map
  }, [productIds, productQueries])

  const columns = useMemo(
    () =>
      buildItemColumns((id) => nameByProductId.get(id) ?? '…'),
    [nameByProductId],
  )

  if (!movementId || movementQuery.isLoading) {
    return <PageLoading title="Movimiento" />
  }

  if (movementQuery.isError || !movement) {
    return (
      <PageMessage
        title="Movimiento no encontrado"
        message="No se pudo cargar el movimiento solicitado."
        icon={Boxes}
        backTo="/inventory"
      />
    )
  }

  return (
    <PageWrapper
      title={stockMovementKindLabel(movement.kind)}
      description="Detalle del movimiento de inventario."
      icon={Boxes}
      leading={
        <BtnLink
          to="/inventory"
          variant="outline"
          size="icon-sm"
          icon={ArrowLeft}
          aria-label="Volver a inventario"
        />
      }
    >
      <div className="space-y-6">
        <DetailSection
          title="Resumen"
          data={movement}
          fields={movementSummaryFields}
        />

        <div className="space-y-2">
          <h2 className="text-sm font-medium">Líneas</h2>
          <DataTable
            columns={columns}
            data={items}
            getRowId={(row) => row.id}
            pagination={{
              page: 1,
              total: items.length,
              onPageChange: () => {},
            }}
          />
        </div>
      </div>
    </PageWrapper>
  )
}
