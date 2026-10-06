import { DebouncedInput } from '../components/debounced-input'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Switch } from '../components/ui/switch'
import { ClearFiltersButton } from '../crud/components/clear-filters-button'
import { FilterBar } from '../crud/components/filter-bar'
import { PHONE_BLACKLIST_REASON_LABELS } from './phone-blacklist-labels'

export const phoneBlacklistListFilterKeys = ['phone', 'reason', 'own_only'] as const

/** Default is "solo míos": empty / missing / anything except `false` means own only. */
export function isOwnOnlyFilter(value: string | undefined): boolean {
  return value !== 'false'
}

export type PhoneBlacklistFiltersProps = {
  filters: { phone: string; reason: string; own_only: string }
  setFilter: (key: 'phone' | 'reason' | 'own_only', value: string) => void
  onClear: () => void
  hasActiveFilters?: boolean
}

export function PhoneBlacklistFilters({
  filters,
  setFilter,
  onClear,
  hasActiveFilters = false,
}: PhoneBlacklistFiltersProps) {
  const ownOnly = isOwnOnlyFilter(filters.own_only)

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
      <div className="flex h-9 items-center gap-2">
        <Switch
          id="blacklist-filter-own-only"
          checked={ownOnly}
          onCheckedChange={(checked) =>
            setFilter('own_only', checked ? '' : 'false')
          }
        />
        <Label htmlFor="blacklist-filter-own-only" className="cursor-pointer whitespace-nowrap">
          Solo míos
        </Label>
      </div>
      {hasActiveFilters ? <ClearFiltersButton onClear={onClear} /> : null}
    </FilterBar>
  )
}
