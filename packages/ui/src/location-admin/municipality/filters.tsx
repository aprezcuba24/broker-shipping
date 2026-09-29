import { useListProvincesLocationsProvincesGet, type ProvincePublic } from '@broker/api'
import { ClearFiltersButton } from '../../crud/components/clear-filters-button'
import { DebouncedInput } from '../../components/debounced-input'
import { EntitySelect } from '../../components/entity-select'
import { FilterBar } from '../../crud/components/filter-bar'

export type MunicipalityFiltersProps = {
  filters: { name: string; province_id: string }
  setFilter: (key: 'name' | 'province_id', value: string) => void
  onClear: () => void
  hasActiveFilters?: boolean
}

export function MunicipalityFilters({
  filters,
  setFilter,
  onClear,
  hasActiveFilters = false,
}: MunicipalityFiltersProps) {
  const provincesQuery = useListProvincesLocationsProvincesGet()
  const provinces = (provincesQuery.data ?? []) as ProvincePublic[]

  return (
    <FilterBar>
      <DebouncedInput
        value={filters.name}
        onDebouncedChange={(value) => setFilter('name', value)}
        placeholder="Buscar municipio…"
        aria-label="Buscar por nombre"
        className="min-w-0 flex-1"
      />
      <EntitySelect
        items={provinces}
        value={filters.province_id}
        onValueChange={(value) => setFilter('province_id', value)}
        placeholder="Todas las provincias"
        allOption={{ label: 'Todas las provincias' }}
        aria-label="Filtrar por provincia"
        triggerClassName="w-full sm:w-56"
      />
      {hasActiveFilters ? <ClearFiltersButton onClear={onClear} /> : null}
    </FilterBar>
  )
}
