import { ProductTable } from './table'
import { ProductsProvider } from './products-context'

export function ProductPage() {
  return (
    <ProductsProvider>
      <ProductTable />
    </ProductsProvider>
  )
}
