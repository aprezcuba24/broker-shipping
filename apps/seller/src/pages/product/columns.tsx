import { type Product } from '@broker/api'
import {
  formatPriceCents,
  useSellerLinkedProviders,
  useSellerProviderCategories,
  type ColumnDef,
} from '@broker/ui'
import { Link, useSearchParams } from 'react-router-dom'

function ProviderName({ providerId }: { providerId: string }) {
  const { getProviderName } = useSellerLinkedProviders()
  return getProviderName(providerId)
}

function CategoryName({
  categoryId,
  providerId,
}: {
  categoryId: string
  providerId: string
}) {
  const { getCategoryName } = useSellerProviderCategories(providerId)
  return getCategoryName(categoryId)
}

function ProductNameLink({ product }: { product: Product }) {
  const [searchParams] = useSearchParams()
  const search = searchParams.toString()
  const to = search ? `/products/${product.id}?${search}` : `/products/${product.id}`

  return (
    <Link to={to} className="font-medium text-primary hover:underline">
      {product.name}
    </Link>
  )
}

export const columns: ColumnDef<Product>[] = [
  {
    id: 'name',
    header: 'Nombre',
    cell: (row) => <ProductNameLink product={row} />,
  },
  {
    id: 'price',
    header: 'Precio',
    cell: (row) => formatPriceCents(row.price),
  },
  {
    id: 'provider',
    header: 'Proveedor',
    cell: (row) => <ProviderName providerId={row.organization_id} />,
  },
  {
    id: 'category_id',
    header: 'Categoría',
    cell: (row) => (
      <CategoryName
        categoryId={row.category_id}
        providerId={row.organization_id}
      />
    ),
  },
  {
    id: 'created_at',
    header: 'Creado',
    accessor: 'created_at',
    type: 'datetime',
  },
  {
    id: 'updated_at',
    header: 'Actualizado',
    accessor: 'updated_at',
    type: 'datetime',
    hideOn: 'sm',
  },
]
