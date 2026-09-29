import {
  useListMunicipalitiesLocationsProvincesProvinceIdMunicipalitiesGet,
  useListProvincesLocationsProvincesGet,
  type MunicipalityPublic,
  type ProvincePublic,
} from '@broker/api'
import { ClearFiltersButton } from '../../crud/components/clear-filters-button'
import { DebouncedInput } from '../../components/debounced-input'
import { EntitySelect } from '../../components/entity-select'
import { FilterBar } from '../../crud/components/filter-bar'

export type NeighborhoodFiltersProps = {
  filters: { name: string; province_id: string; municipality_id: string }
  setFilter: (key: 'name' | 'province_id' | 'municipality_id', value: string) => void
  setFilters: (updates: Partial<NeighborhoodFiltersProps['filters']>) => void
  onClear: () => void
  hasActiveFilters?: boolean
}

export function NeighborhoodFilters({
  filters,
  setFilter,
  setFilters,
  onClear,
  hasActiveFilters = false,
}: NeighborhoodFiltersProps) {
  const provincesQuery = useListProvincesLocationsProvincesGet()
  const provinces = (provincesQuery.data ?? []) as ProvincePublic[]

  const municipalitiesQuery = useListMunicipalitiesLocationsProvincesProvinceIdMunicipalitiesGet(
    filters.province_id,
    undefined,
    { query: { enabled: Boolean(filters.province_id) } },
  )
  const municipalities = (municipalitiesQuery.data ?? []) as MunicipalityPublic[]

  return (
    <FilterBar>
      <DebouncedInput
        value={filters.name}
        onDebouncedChange={(value) => setFilter('name', value)}
        placeholder="Buscar barrio…"
        aria-label="Buscar por nombre"
        className="min-w-0 flex-1"
      />
      <EntitySelect
        items={provinces}
        value={filters.province_id}
        onValueChange={(value) => {
          setFilters({ province_id: value, municipality_id: '' })
        }}
        placeholder="Todas las provincias"
        allOption={{ label: 'Todas las provincias' }}
        aria-label="Filtrar por provincia"
        triggerClassName="w-full sm:w-48"
      />
      <EntitySelect
        items={municipalities}
        value={filters.municipality_id}
        onValueChange={(value) => setFilter('municipality_id', value)}
        placeholder={
          filters.province_id ? 'Todos los municipios' : 'Selecciona una provincia'
        }
        allOption={{ label: 'Todos los municipios' }}
        disabled={!filters.province_id}
        aria-label="Filtrar por municipio"
        triggerClassName="w-full sm:w-48"
      />
      {hasActiveFilters ? <ClearFiltersButton onClear={onClear} /> : null}
    </FilterBar>
  )
}
