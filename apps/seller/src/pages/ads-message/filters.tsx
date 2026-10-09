import {
  ClearFiltersButton,
  DebouncedInput,
  FilterBar,
  type ListParams,
} from '@broker/ui'

export type AdsMessageListParams = ListParams<'title'>

export type AdsMessageFiltersProps = {
  filters: AdsMessageListParams['filters']
  setFilter: AdsMessageListParams['setFilter']
  onClear: () => void
  hasActiveFilters?: boolean
}

export function AdsMessageFilters({
  filters,
  setFilter,
  onClear,
  hasActiveFilters = false,
}: AdsMessageFiltersProps) {
  return (
    <FilterBar>
      <DebouncedInput
        value={filters.title}
        onDebouncedChange={(value) => setFilter('title', value)}
        placeholder="Buscar por título o código…"
        aria-label="Buscar por título o código"
        className="min-w-0 flex-1"
      />
      {hasActiveFilters ? <ClearFiltersButton onClear={onClear} /> : null}
    </FilterBar>
  )
}
