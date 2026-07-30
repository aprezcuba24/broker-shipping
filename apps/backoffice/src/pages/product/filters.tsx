import {
  ClearFiltersButton,
  DebouncedInput,
  FilterBar,
  TagsField,
  type ListParams,
} from '@broker/ui'

export type ProductListParams = ListParams<'name', 'tag_ids'>

export type ProductFiltersProps = {
  filters: ProductListParams['filters']
  setFilter: ProductListParams['setFilter']
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
      <div className="min-w-[220px] flex-1 sm:max-w-sm">
        <TagsField
          value={filters.tag_ids}
          onValueChange={(ids) => setFilter('tag_ids', ids)}
          pageSize={50}
          placeholder="Filtrar por etiquetas…"
          searchPlaceholder="Buscar etiqueta…"
          aria-label="Filtrar por etiquetas"
        />
      </div>
      {hasActiveFilters ? <ClearFiltersButton onClear={onClear} /> : null}
    </FilterBar>
  )
}
