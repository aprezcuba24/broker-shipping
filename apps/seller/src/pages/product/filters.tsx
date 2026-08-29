import type { OrganizationPublic } from '@broker/api'
import {
  ClearFiltersButton,
  DebouncedInput,
  EntitySelect,
  FilterBar,
  type ListParams,
} from '@broker/ui'

export type ProductListParams = ListParams<'name' | 'provider_id'>

export type ProductFiltersProps = {
  filters: ProductListParams['filters']
  setFilter: ProductListParams['setFilter']
  onClear: () => void
  hasActiveFilters?: boolean
  providers: OrganizationPublic[]
  providersLoading?: boolean
}

export function ProductFilters({
  filters,
  setFilter,
  onClear,
  hasActiveFilters = false,
  providers,
  providersLoading = false,
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
      <div className="min-w-0 flex-1 sm:min-w-[220px] sm:max-w-sm">
        <EntitySelect
          items={providers}
          value={filters.provider_id || undefined}
          onValueChange={(value) => setFilter('provider_id', value)}
          placeholder="Proveedor"
          allOption={{ label: 'Todos los proveedores' }}
          disabled={providersLoading}
          aria-label="Filtrar por proveedor"
          triggerClassName="w-full"
        />
      </div>
      {hasActiveFilters ? <ClearFiltersButton onClear={onClear} /> : null}
    </FilterBar>
  )
}
