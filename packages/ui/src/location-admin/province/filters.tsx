import { ClearFiltersButton } from '../../crud/components/clear-filters-button'
import { DebouncedInput } from '../../components/debounced-input'
import { FilterBar } from '../../crud/components/filter-bar'

export type ProvinceFiltersProps = {
  filters: { name: string }
  setFilter: (key: 'name', value: string) => void
  onClear: () => void
  hasActiveFilters?: boolean
}

export function ProvinceFilters({
  filters,
  setFilter,
  onClear,
  hasActiveFilters = false,
}: ProvinceFiltersProps) {
  return (
    <FilterBar>
      <DebouncedInput
        value={filters.name}
        onDebouncedChange={(value) => setFilter('name', value)}
        placeholder="Buscar provincia…"
        aria-label="Buscar por nombre"
        className="min-w-0 flex-1"
      />
      {hasActiveFilters ? <ClearFiltersButton onClear={onClear} /> : null}
    </FilterBar>
  )
}
