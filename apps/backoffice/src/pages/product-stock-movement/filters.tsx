import {
  ClearFiltersButton,
  EntitySelect,
  FilterBar,
  type ListParams,
} from '@broker/ui'

import { STOCK_MOVEMENT_KIND_FILTER_OPTIONS } from './labels'

export type StockMovementListParams = ListParams<'kind'>

export type StockMovementFiltersProps = {
  filters: StockMovementListParams['filters']
  setFilter: StockMovementListParams['setFilter']
  onClear: () => void
  hasActiveFilters?: boolean
}

export function StockMovementFilters({
  filters,
  setFilter,
  onClear,
  hasActiveFilters = false,
}: StockMovementFiltersProps) {
  return (
    <FilterBar>
      <div className="min-w-[180px] flex-1 sm:max-w-xs">
        <EntitySelect
          items={[...STOCK_MOVEMENT_KIND_FILTER_OPTIONS]}
          value={filters.kind || undefined}
          onValueChange={(value) => setFilter('kind', value)}
          placeholder="Tipo de movimiento"
          allOption={{ label: 'Todos' }}
          aria-label="Filtrar por tipo"
          triggerClassName="w-full"
        />
      </div>
      {hasActiveFilters ? <ClearFiltersButton onClear={onClear} /> : null}
    </FilterBar>
  )
}
