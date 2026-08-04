import {
  ClearFiltersButton,
} from '../crud/components/clear-filters-button'
import { FilterBar } from '../crud/components/filter-bar'
import type { ListParams } from '../crud/hooks/use-list-params'
import { DebouncedInput } from '../components/debounced-input'
import { EntitySelect } from '../components/entity-select'
import { ORDER_STATUS_FILTER_OPTIONS } from './status'

export type OrderListParams = ListParams<'search' | 'status'>

export type OrderFiltersProps = {
  filters: OrderListParams['filters']
  setFilter: OrderListParams['setFilter']
  onClear: () => void
  hasActiveFilters?: boolean
}

export function OrderFilters({
  filters,
  setFilter,
  onClear,
  hasActiveFilters = false,
}: OrderFiltersProps) {
  return (
    <FilterBar>
      <DebouncedInput
        value={filters.search}
        onDebouncedChange={(value) => setFilter('search', value)}
        placeholder="Buscar por código, cliente, teléfono o CI…"
        aria-label="Buscar órdenes"
        className="min-w-0 flex-1"
      />
      <div className="min-w-[180px] flex-1 sm:max-w-xs">
        <EntitySelect
          items={ORDER_STATUS_FILTER_OPTIONS}
          value={filters.status || undefined}
          onValueChange={(value) => setFilter('status', value)}
          placeholder="Estado"
          allOption={{ label: 'Todos los estados' }}
          aria-label="Filtrar por estado"
          triggerClassName="w-full"
        />
      </div>
      {hasActiveFilters ? <ClearFiltersButton onClear={onClear} /> : null}
    </FilterBar>
  )
}
