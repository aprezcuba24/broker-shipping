import { ClearFiltersButton } from '../crud/components/clear-filters-button'
import { FilterBar } from '../crud/components/filter-bar'
import type { ListParams } from '../crud/hooks/use-list-params'
import { EntitySelect } from '../components/entity-select'
import { COMMISSION_PAID_FILTER_OPTIONS } from './status'

export type CommissionListParams = ListParams<'is_paid'>

export type CommissionFiltersProps = {
  filters: CommissionListParams['filters']
  setFilter: CommissionListParams['setFilter']
  onClear: () => void
  hasActiveFilters?: boolean
}

export function CommissionFilters({
  filters,
  setFilter,
  onClear,
  hasActiveFilters = false,
}: CommissionFiltersProps) {
  return (
    <FilterBar>
      <div className="min-w-[180px] flex-1 sm:max-w-xs">
        <EntitySelect
          items={COMMISSION_PAID_FILTER_OPTIONS}
          value={filters.is_paid || undefined}
          onValueChange={(value) => setFilter('is_paid', value)}
          placeholder="Estado de pago"
          allOption={{ label: 'Todas' }}
          aria-label="Filtrar por estado de pago"
          triggerClassName="w-full"
        />
      </div>
      {hasActiveFilters ? <ClearFiltersButton onClear={onClear} /> : null}
    </FilterBar>
  )
}
