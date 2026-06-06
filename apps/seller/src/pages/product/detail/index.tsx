import { useGetProductProductsSellerProductIdGet } from '@broker/api'
import {
  Button,
  formatPriceCents,
  PageWrapper,
  useSellerLinkedProviders,
  useSellerProviderCategories,
} from '@broker/ui'
import { ArrowLeft, Package } from 'lucide-react'
import { type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

const dateTimeFormatter = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date)
}

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  )
}

export function ProductDetailPage() {
  const { productId = '' } = useParams()
  const [searchParams] = useSearchParams()

  const { data: product, isLoading, isError } =
    useGetProductProductsSellerProductIdGet(productId, {
      query: { enabled: !!productId },
    })

  const { getProviderName } = useSellerLinkedProviders()

  const providerId = product?.organization_id ?? ''
  const { getCategoryName } = useSellerProviderCategories(providerId)

  const providerName = product ? getProviderName(product.organization_id) : '—'
  const categoryName = product ? getCategoryName(product.category_id) : '—'

  const backSearch = searchParams.toString()
  const backTo = backSearch ? `/products?${backSearch}` : '/products'

  if (isLoading) {
    return (
      <PageWrapper title="Producto" icon={Package}>
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </PageWrapper>
    )
  }

  if (isError || !product) {
    return (
      <PageWrapper
        title="Producto no encontrado"
        icon={Package}
        buttons={[
          <Button key="back" variant="outline" size="sm" asChild>
            <Link to={backTo}>
              <ArrowLeft className="h-4 w-4" />
              Volver al catálogo
            </Link>
          </Button>,
        ]}
      >
        <p className="text-sm text-muted-foreground">
          El producto no existe o no tienes acceso a él.
        </p>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title={product.name}
      description="Detalle del producto"
      icon={Package}
      buttons={[
        <Button key="back" variant="outline" size="sm" asChild>
          <Link to={backTo}>
            <ArrowLeft className="h-4 w-4" />
            Volver al catálogo
          </Link>
        </Button>,
      ]}
    >
      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailField label="Nombre" value={product.name} />
        <DetailField label="Precio" value={formatPriceCents(product.price)} />
        <DetailField label="Proveedor" value={providerName} />
        <DetailField label="Categoría" value={categoryName} />
        <DetailField label="Creado" value={formatDateTime(product.created_at)} />
        <DetailField label="Actualizado" value={formatDateTime(product.updated_at)} />
      </dl>
    </PageWrapper>
  )
}
