import {
  ClearFiltersButton,
  DebouncedInput,
  FilterBar,
  type ListParams,
} from '@broker/ui'

export type OrderListParams = ListParams<'search'>

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
      {hasActiveFilters ? <ClearFiltersButton onClear={onClear} /> : null}
    </FilterBar>
  )
}
