import {
  ClearFiltersButton,
  DebouncedInput,
  FilterBar,
} from '@broker/ui'

export type ProductFiltersProps = {
  filters: { name: string }
  setFilter: (key: 'name', value: string) => void
  onClear: () => void
  hasActiveFilters?: boolean
}

export function ProductFilters({
  filters,
  setFilter,
  onClear,
  hasActiveFilters = false,
}: ProductFiltersProps) {
  return (
    <FilterBar>
      <DebouncedInput
        value={filters.name}
        onDebouncedChange={(value) => setFilter('name', value)}
        placeholder="Buscar producto…"
        aria-label="Buscar por nombre"
        className="min-w-0 flex-1"
      />
      {hasActiveFilters ? <ClearFiltersButton onClear={onClear} /> : null}
    </FilterBar>
  )
}
