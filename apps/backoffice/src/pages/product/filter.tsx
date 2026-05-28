import { useListCategoriesProductsCategoriesGet } from '@broker/api'
import { DebouncedInput, EntitySelect, ListFilterBar } from '@broker/ui'
import { useProducts } from './products-context'

export function ProductFilters() {
  const { filters, setFilter } = useProducts()
  const { data: categories = [] } = useListCategoriesProductsCategoriesGet()

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
        items={categories}
        value={filters.category_id}
        onValueChange={(value) => setFilter('category_id', value)}
        allOption={{ label: 'Todas las categorías' }}
        placeholder="Categoría"
        aria-label="Filtrar por categoría"
        triggerClassName="w-full shrink-0 sm:w-48"
      />
    </ListFilterBar>
  )
}
