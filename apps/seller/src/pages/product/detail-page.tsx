import {
  formatDateTime,
  useGetProductProductsSellerProductIdGet,
  type GetProductProductsSellerProductIdGetParams,
} from '@broker/api'
import {
  BadgeList,
  BtnLink,
  PageLoading,
  PageMessage,
  PageWrapper,
} from '@broker/ui'
import { ArrowLeft, Package } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { useLinkedProviders } from '@/hooks/use-linked-providers'

export function ProductDetailPage() {
  const { productId = '' } = useParams<{ productId: string }>()

  const productQuery = useGetProductProductsSellerProductIdGet(
    productId,
    {} as GetProductProductsSellerProductIdGetParams,
    { query: { enabled: Boolean(productId) } },
  )

  const { getProviderName } = useLinkedProviders()

  if (!productId || productQuery.isLoading) {
    return <PageLoading title="Producto" />
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <PageMessage
        title="Producto no encontrado"
        message="No se pudo cargar el producto solicitado."
        icon={Package}
        backTo="/products"
      />
    )
  }

  const product = productQuery.data

  return (
    <PageWrapper
      title={product.name}
      description="Detalle del producto en el catálogo de proveedores."
      icon={Package}
      leading={
        <BtnLink
          to="/products"
          variant="outline"
          size="icon-sm"
          icon={ArrowLeft}
          aria-label="Volver a productos"
        />
      }
    >
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="text-sm font-medium text-muted-foreground">Nombre</dt>
          <dd className="text-sm">{product.name}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-sm font-medium text-muted-foreground">Proveedor</dt>
          <dd className="text-sm">{getProviderName(product.organization_id)}</dd>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <dt className="text-sm font-medium text-muted-foreground">Etiquetas</dt>
          <dd>
            <BadgeList
              items={(product.tags ?? []).map((tag) => ({
                id: tag.id,
                label: tag.name,
              }))}
            />
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-sm font-medium text-muted-foreground">Creado</dt>
          <dd className="text-sm">{formatDateTime(product.created_at)}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-sm font-medium text-muted-foreground">Actualizado</dt>
          <dd className="text-sm">{formatDateTime(product.updated_at)}</dd>
        </div>
      </dl>
    </PageWrapper>
  )
}
