import {
  useGetProductProductsSellerProductIdGet,
  type GetProductProductsSellerProductIdGetParams,
} from '@broker/api'
import {
  SellerProductDetailPage as ProductDetailView,
  SellerSalePriceSection,
} from '@broker/ui'
import { useParams } from 'react-router-dom'

import { useLinkedProviders } from '@/hooks/use-linked-providers'

export function ProductDetailPage() {
  const { productId = '' } = useParams<{ productId: string }>()
  const { getProviderName } = useLinkedProviders()

  const productQuery = useGetProductProductsSellerProductIdGet(
    productId,
    {} as GetProductProductsSellerProductIdGetParams,
    { query: { enabled: Boolean(productId) } },
  )

  const product = productQuery.data

  return (
    <ProductDetailView
      isLoading={!productId || productQuery.isLoading}
      isError={productQuery.isError}
      product={product}
      getProviderName={getProviderName}
      description="Detalle del producto en el catálogo de proveedores."
    >
      {product ? <SellerSalePriceSection product={product} /> : null}
    </ProductDetailView>
  )
}
