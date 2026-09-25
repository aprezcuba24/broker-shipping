import {
  ClearFiltersButton,
  DebouncedInput,
  FilterBar,
  type ListParams,
} from '@broker/ui'

export type CustomerListParams = ListParams<'name' | 'ci' | 'phone'>

export type CustomerFiltersProps = {
  filters: CustomerListParams['filters']
  setFilter: CustomerListParams['setFilter']
  onClear: () => void
  hasActiveFilters?: boolean
}

export function CustomerFilters({
  filters,
  setFilter,
  onClear,
  hasActiveFilters = false,
}: CustomerFiltersProps) {
  return (
    <FilterBar>
      <DebouncedInput
        value={filters.name}
        onDebouncedChange={(value) => setFilter('name', value)}
        placeholder="Nombre…"
        aria-label="Filtrar por nombre"
        className="min-w-0 flex-1"
      />
      <DebouncedInput
        value={filters.phone}
        onDebouncedChange={(value) => setFilter('phone', value)}
        placeholder="Teléfono…"
        aria-label="Filtrar por teléfono"
        className="min-w-0 flex-1 sm:max-w-xs"
      />
      <DebouncedInput
        value={filters.ci}
        onDebouncedChange={(value) => setFilter('ci', value)}
        placeholder="CI…"
        aria-label="Filtrar por CI"
        className="min-w-0 flex-1 sm:max-w-xs"
      />
      {hasActiveFilters ? <ClearFiltersButton onClear={onClear} /> : null}
    </FilterBar>
  )
}
