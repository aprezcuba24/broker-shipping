import { ProductsProvider } from './products-context'
import { ProductTable } from './table'

export function ProductPage() {
  return (
    <ProductsProvider>
      <ProductTable />
    </ProductsProvider>
  )
}
