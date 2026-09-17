import {
  StockMovementDirection,
  StockMovementKind,
  type StockMovementDirection as StockMovementDirectionType,
  type StockMovementKind as StockMovementKindType,
} from '@broker/api'

export const STOCK_MOVEMENT_KIND_LABEL: Record<StockMovementKindType, string> = {
  [StockMovementKind.reception]: 'Recepción',
  [StockMovementKind.shrinkage]: 'Merma',
  [StockMovementKind.correction]: 'Corrección',
}

export const STOCK_MOVEMENT_DIRECTION_LABEL: Record<
  StockMovementDirectionType,
  string
> = {
  [StockMovementDirection.in]: 'Entrada',
  [StockMovementDirection.out]: 'Salida',
}

export const STOCK_MOVEMENT_KIND_OPTIONS = [
  { id: StockMovementKind.reception, name: STOCK_MOVEMENT_KIND_LABEL.reception },
  { id: StockMovementKind.shrinkage, name: STOCK_MOVEMENT_KIND_LABEL.shrinkage },
  { id: StockMovementKind.correction, name: STOCK_MOVEMENT_KIND_LABEL.correction },
] as const

export const STOCK_MOVEMENT_KIND_FILTER_OPTIONS = [
  ...STOCK_MOVEMENT_KIND_OPTIONS,
]

export const STOCK_MOVEMENT_DIRECTION_OPTIONS = [
  {
    id: StockMovementDirection.in,
    name: STOCK_MOVEMENT_DIRECTION_LABEL[StockMovementDirection.in],
  },
  {
    id: StockMovementDirection.out,
    name: STOCK_MOVEMENT_DIRECTION_LABEL[StockMovementDirection.out],
  },
] as const

export function stockMovementKindLabel(kind: StockMovementKindType): string {
  return STOCK_MOVEMENT_KIND_LABEL[kind] ?? kind
}

export function stockMovementDirectionLabel(
  direction: StockMovementDirectionType,
): string {
  return STOCK_MOVEMENT_DIRECTION_LABEL[direction] ?? direction
}
