import { DebouncedInput, EntitySelect, ListFilterBar, useSellerLinkedProviders, useSellerProviderCategories } from '@broker/ui'
import { useProducts } from './products-context'

export function ProductFilters() {
  const { filters, setFilter, setFilters } = useProducts()
  const { providers } = useSellerLinkedProviders()
  const { categories } = useSellerProviderCategories(filters.provider_id)

  return (
    <ListFilterBar>
      <DebouncedInput
        value={filters.name}
        onDebouncedChange={(value) => setFilter('name', value)}
        placeholder="Buscar producto…"
        aria-label="Buscar por nombre"
        className="min-w-0 flex-1"
      />
      <EntitySelect
        items={providers}
        value={filters.provider_id}
        onValueChange={(value) =>
          setFilters({ provider_id: value, category_id: '' })
        }
        allOption={{ label: 'Todos los proveedores' }}
        placeholder="Proveedor"
        aria-label="Filtrar por proveedor"
        triggerClassName="w-full shrink-0 sm:w-48"
      />
      <EntitySelect
        items={categories}
        value={filters.category_id}
        onValueChange={(value) => setFilter('category_id', value)}
        allOption={{ label: 'Todas las categorías' }}
        placeholder="Categoría"
        aria-label="Filtrar por categoría"
        disabled={!filters.provider_id}
        triggerClassName="w-full shrink-0 sm:w-48"
      />
    </ListFilterBar>
  )
}
