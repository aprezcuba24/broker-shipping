import {
  ClearFiltersButton,
  DebouncedInput,
  FilterBar,
  type ListParams,
} from '@broker/ui'

export type FacebookGroupListParams = ListParams<'name'>

export type FacebookGroupFiltersProps = {
  filters: FacebookGroupListParams['filters']
  setFilter: FacebookGroupListParams['setFilter']
  onClear: () => void
  hasActiveFilters?: boolean
}

export function FacebookGroupFilters({
  filters,
  setFilter,
  onClear,
  hasActiveFilters = false,
}: FacebookGroupFiltersProps) {
  return (
    <FilterBar>
      <DebouncedInput
        value={filters.name}
        onDebouncedChange={(value) => setFilter('name', value)}
        placeholder="Buscar grupo…"
        aria-label="Buscar por nombre"
        className="min-w-0 flex-1"
      />
      {hasActiveFilters ? <ClearFiltersButton onClear={onClear} /> : null}
    </FilterBar>
  )
}
