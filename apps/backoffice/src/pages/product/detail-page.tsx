import {
  useGetProductProductsProviderProductIdGet,
  type GetProductProductsProviderProductIdGetParams,
} from '@broker/api'
import { BtnLink, ProductDetailPage as ProductDetailView } from '@broker/ui'
import { Pencil } from 'lucide-react'
import { useParams } from 'react-router-dom'

export function ProductDetailPage() {
  const { productId = '' } = useParams<{ productId: string }>()

  const productQuery = useGetProductProductsProviderProductIdGet(
    productId,
    {} as GetProductProductsProviderProductIdGetParams,
    { query: { enabled: Boolean(productId) } },
  )

  const product = productQuery.data

  return (
    <ProductDetailView
      isLoading={!productId || productQuery.isLoading}
      isError={productQuery.isError}
      product={product}
      description="Detalle del producto de tu catálogo."
      buttons={
        product
          ? [
              <BtnLink
                key="edit"
                to={`/products/${product.id}/edit`}
                icon={Pencil}
              >
                Editar
              </BtnLink>,
            ]
          : null
      }
    />
  )
}
