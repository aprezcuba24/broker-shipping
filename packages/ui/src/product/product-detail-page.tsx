import { formatDateTime, type ProductPublic } from '@broker/api'
import { ArrowLeft, Package } from 'lucide-react'
import type { ReactNode } from 'react'

import { BadgeList } from '../components/badge-list'
import { BtnLink } from '../components/btn-link'
import {
  DetailSection,
  type DetailSectionField,
} from '../components/detail-section'
import { PageLoading } from '../components/page-loading'
import { PageMessage } from '../components/page-message'
import { PageWrapper } from '../components/page-wrapper'
import { Thumbnail } from '../components/thumbnail'
import { formatMoney } from '../lib/utils'

const productDetailImageField: DetailSectionField<ProductPublic> = {
  title: 'Imagen',
  accessor: (product) => product,
  format: (value) => {
    const product = value as ProductPublic
    return (
      <Thumbnail
        src={product.image_url}
        alt={product.name}
        size="lg"
        fallbackIcon={Package}
      />
    )
  },
}

const productDetailNameField: DetailSectionField<ProductPublic> = {
  title: 'Nombre',
  accessor: (product) => product.name,
}

const productDetailPriceField: DetailSectionField<ProductPublic> = {
  title: 'Precio',
  accessor: (product) => product,
  format: (value) => {
    const product = value as ProductPublic
    return (
      <span className="tabular-nums">
        {formatMoney(product.price, product.currency)}
      </span>
    )
  },
}

const productDetailCommissionField: DetailSectionField<ProductPublic> = {
  title: 'Comisión',
  accessor: (product) => product,
  format: (value) => {
    const product = value as ProductPublic
    return (
      <span className="tabular-nums">
        {formatMoney(product.commission, product.currency)}
      </span>
    )
  },
}

const productDetailTagsField: DetailSectionField<ProductPublic> = {
  title: 'Etiquetas',
  accessor: (product) => product.tags,
  fullWidth: true,
  format: (value) => {
    const tags = value as ProductPublic['tags']
    return (
      <BadgeList
        items={(tags ?? []).map((tag) => ({
          id: tag.id,
          label: tag.name,
        }))}
      />
    )
  },
}

const productDetailCreatedField: DetailSectionField<ProductPublic> = {
  title: 'Creado',
  accessor: (product) => product.created_at,
  format: (value) => formatDateTime(value as string),
}

const productDetailUpdatedField: DetailSectionField<ProductPublic> = {
  title: 'Actualizado',
  accessor: (product) => product.updated_at,
  format: (value) =>
    value ? formatDateTime(value as string) : '—',
}

/** Provider (backoffice) summary fields — no provider column. */
export const productDetailBaseFields: DetailSectionField<ProductPublic>[] = [
  productDetailImageField,
  productDetailNameField,
  productDetailPriceField,
  productDetailCommissionField,
  productDetailTagsField,
  productDetailCreatedField,
  productDetailUpdatedField,
]

export type ProductDetailPageProps = {
  isLoading: boolean
  isError: boolean
  product: ProductPublic | undefined
  backTo?: string
  description?: string
  buttons?: ReactNode[] | null
  children?: ReactNode
}

export type SellerProductDetailPageProps = ProductDetailPageProps & {
  getProviderName: (organizationId: string) => string
}

type ProductDetailLayoutProps = ProductDetailPageProps & {
  summaryFields: DetailSectionField<ProductPublic>[]
}

function ProductDetailLayout({
  isLoading,
  isError,
  product,
  backTo = '/products',
  description = 'Detalle del producto.',
  buttons,
  children,
  summaryFields,
}: ProductDetailLayoutProps) {
  if (isLoading) {
    return <PageLoading title="Producto" />
  }

  if (isError || !product) {
    return (
      <PageMessage
        title="Producto no encontrado"
        message="No se pudo cargar el producto solicitado."
        icon={Package}
        backTo={backTo}
      />
    )
  }

  return (
    <PageWrapper
      title={product.name}
      description={description}
      icon={Package}
      leading={
        <BtnLink
          to={backTo}
          variant="outline"
          size="icon-sm"
          icon={ArrowLeft}
          aria-label="Volver a productos"
        />
      }
      buttons={buttons}
    >
      <div className="space-y-6">
        <DetailSection title="Resumen" data={product} fields={summaryFields} />
        {children}
      </div>
    </PageWrapper>
  )
}

function buildSellerProductDetailFields(
  getProviderName: (organizationId: string) => string,
): DetailSectionField<ProductPublic>[] {
  const providerField: DetailSectionField<ProductPublic> = {
    title: 'Proveedor',
    accessor: (product) => product.organization_id,
    format: (value) => getProviderName(String(value)),
  }

  return [
    productDetailImageField,
    productDetailNameField,
    providerField,
    productDetailPriceField,
    productDetailCommissionField,
    productDetailTagsField,
    productDetailCreatedField,
    productDetailUpdatedField,
  ]
}

/** Provider product detail — Resumen omits Proveedor. */
export function ProductDetailPage(props: ProductDetailPageProps) {
  return (
    <ProductDetailLayout {...props} summaryFields={productDetailBaseFields} />
  )
}

/** Seller product detail — Resumen includes Proveedor. */
export function SellerProductDetailPage({
  getProviderName,
  ...props
}: SellerProductDetailPageProps) {
  return (
    <ProductDetailLayout
      {...props}
      summaryFields={buildSellerProductDetailFields(getProviderName)}
    />
  )
}
