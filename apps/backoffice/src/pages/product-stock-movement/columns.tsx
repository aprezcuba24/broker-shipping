import type { ProductStockMovementPublic } from '@broker/api'
import {
  actionsColumn,
  Badge,
  BtnLink,
  BtnList,
  componentColumn,
  dateTimeColumn,
  textColumn,
  type ColumnDef,
} from '@broker/ui'
import { Eye } from 'lucide-react'

import {
  stockMovementDirectionLabel,
  stockMovementKindLabel,
} from './labels'

export function buildStockMovementColumns(): ColumnDef<ProductStockMovementPublic>[] {
  return [
    componentColumn<ProductStockMovementPublic>('kind', 'Tipo', (row) => (
      <Badge variant="secondary">{stockMovementKindLabel(row.kind)}</Badge>
    )),
    componentColumn<ProductStockMovementPublic>('direction', 'Dirección', (row) => (
      <Badge variant="outline">{stockMovementDirectionLabel(row.direction)}</Badge>
    )),
    dateTimeColumn<ProductStockMovementPublic>({
      id: 'moved_at',
      accessor: 'moved_at',
      header: 'Fecha',
    }),
    textColumn<ProductStockMovementPublic>({
      id: 'notes',
      header: 'Notas',
      hideOn: 'sm',
      cell: (row) => row.notes?.trim() || '—',
    }),
    actionsColumn<ProductStockMovementPublic>((row) => (
      <BtnList>
        <BtnLink
          to={`/inventory/${row.id}`}
          variant="ghost"
          size="sm"
          icon={Eye}
          aria-label={`Ver movimiento ${stockMovementKindLabel(row.kind)}`}
        >
          Ver
        </BtnLink>
      </BtnList>
    )),
  ]
}
