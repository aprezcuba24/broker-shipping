import { DebouncedInput } from '../components/debounced-input'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { ClearFiltersButton } from '../crud/components/clear-filters-button'
import { FilterBar } from '../crud/components/filter-bar'
import { PHONE_BLACKLIST_REASON_LABELS } from './phone-blacklist-labels'

export const phoneBlacklistListFilterKeys = ['phone', 'reason'] as const

export type PhoneBlacklistFiltersProps = {
  filters: { phone: string; reason: string }
  setFilter: (key: 'phone' | 'reason', value: string) => void
  onClear: () => void
  hasActiveFilters?: boolean
}

export function PhoneBlacklistFilters({
  filters,
  setFilter,
  onClear,
  hasActiveFilters = false,
}: PhoneBlacklistFiltersProps) {
  return (
    <FilterBar>
      <DebouncedInput
        value={filters.phone}
        onDebouncedChange={(value) => setFilter('phone', value)}
        placeholder="Buscar teléfono…"
        aria-label="Buscar por teléfono"
        className="min-w-0 flex-1"
      />
      <div className="flex min-w-[10rem] flex-col gap-1">
        <Label htmlFor="blacklist-filter-reason" className="sr-only">
          Motivo
        </Label>
        <Select
          value={filters.reason || '__all__'}
          onValueChange={(value) =>
            setFilter('reason', value === '__all__' ? '' : value)
          }
        >
          <SelectTrigger id="blacklist-filter-reason" className="h-9">
            <SelectValue placeholder="Motivo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los motivos</SelectItem>
            {Object.entries(PHONE_BLACKLIST_REASON_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {hasActiveFilters ? <ClearFiltersButton onClear={onClear} /> : null}
    </FilterBar>
  )
}
