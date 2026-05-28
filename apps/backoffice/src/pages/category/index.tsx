import { CategoriesProvider } from './categories-context'
import { CategoryTable } from './table'

export function CategoryPage() {
  return (
    <CategoriesProvider>
      <CategoryTable />
    </CategoriesProvider>
  )
}
