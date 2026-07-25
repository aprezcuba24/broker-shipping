import {
  DebouncedInput,
  EntitySelect,
  Input,
  ListFilterBar,
  useSellerLinkedProviders,
} from '@broker/ui'
import { useOrders } from './orders-context'

export function OrderFilters() {
  const { filters, setFilter } = useOrders()
  const { providers } = useSellerLinkedProviders()

  return (
    <ListFilterBar>
      <DebouncedInput
        value={filters.name}
        onDebouncedChange={(value) => setFilter('name', value)}
        placeholder="Buscar por código…"
        aria-label="Buscar por código de orden"
        className="min-w-0 flex-1"
      />
      <DebouncedInput
        value={filters.customer_name}
        onDebouncedChange={(value) => setFilter('customer_name', value)}
        placeholder="Cliente…"
        aria-label="Filtrar por nombre de cliente"
        className="min-w-0 flex-1"
      />
      <DebouncedInput
        value={filters.customer_phone}
        onDebouncedChange={(value) => setFilter('customer_phone', value)}
        placeholder="Teléfono…"
        aria-label="Filtrar por teléfono de cliente"
        className="min-w-0 flex-1 sm:max-w-40"
      />
      <EntitySelect
        items={providers}
        value={filters.provider_organization_id}
        onValueChange={(value) => setFilter('provider_organization_id', value)}
        allOption={{ label: 'Todos los proveedores' }}
        placeholder="Proveedor"
        aria-label="Filtrar por proveedor"
        triggerClassName="w-full shrink-0 sm:w-48"
      />
      <Input
        type="date"
        value={filters.created_at_from}
        onChange={(event) => setFilter('created_at_from', event.target.value)}
        aria-label="Fecha desde"
        className="w-full shrink-0 sm:w-40"
      />
      <Input
        type="date"
        value={filters.created_at_to}
        onChange={(event) => setFilter('created_at_to', event.target.value)}
        aria-label="Fecha hasta"
        className="w-full shrink-0 sm:w-40"
      />
    </ListFilterBar>
  )
}
