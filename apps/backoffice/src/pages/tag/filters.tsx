import {
  ClearFiltersButton,
  DebouncedInput,
  FilterBar,
  Label,
  Switch,
} from '@broker/ui'

export type TagFiltersProps = {
  filters: { name: string; is_active: string }
  setFilter: (key: 'name' | 'is_active', value: string) => void
  onClear: () => void
  hasActiveFilters?: boolean
}

export function TagFilters({
  filters,
  setFilter,
  onClear,
  hasActiveFilters = false,
}: TagFiltersProps) {
  return (
    <FilterBar>
      <DebouncedInput
        value={filters.name}
        onDebouncedChange={(value) => setFilter('name', value)}
        placeholder="Buscar etiqueta…"
        aria-label="Buscar por nombre"
        className="min-w-0 flex-1"
      />
      <div className="flex items-center gap-2">
        <Switch
          id="tag-filter-is-active"
          checked={filters.is_active === 'true'}
          onCheckedChange={(checked) => setFilter('is_active', checked ? 'true' : '')}
          aria-label="Solo activas"
        />
        <Label htmlFor="tag-filter-is-active" className="whitespace-nowrap">
          Solo activas
        </Label>
      </div>
      {hasActiveFilters ? <ClearFiltersButton onClear={onClear} /> : null}
    </FilterBar>
  )
}
