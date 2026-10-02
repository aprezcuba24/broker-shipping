import { formatDateTime, type ProductPublic } from '@broker/api'
import { ArrowLeft, Package } from 'lucide-react'
import type { ReactNode } from 'react'

import { BadgeList } from '../components/badge-list'
import { BtnLink } from '../components/btn-link'
import { CommissionValue } from '../components/commission-value'
import { FormFieldCell, FormSection } from '../components/form-section'
import { PageLoading } from '../components/page-loading'
import { PageMessage } from '../components/page-message'
import { PageWrapper } from '../components/page-wrapper'
import { Thumbnail } from '../components/thumbnail'
import { Field, FieldLabel } from '../components/ui/field'
import { formatMoney } from '../lib/utils'
import { SellerProductPriceBadge } from './seller-product-price-badge'

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
  providerName?: string
}

function DetailField({
  label,
  children,
  fullWidth = false,
}: {
  label: string
  children: ReactNode
  fullWidth?: boolean
}) {
  return (
    <FormFieldCell fullWidth={fullWidth}>
      <Field>
        <FieldLabel>{label}</FieldLabel>
        <div className="text-sm font-medium break-words text-on-surface">{children}</div>
      </Field>
    </FormFieldCell>
  )
}

function ProductDetailBody({
  product,
  providerName,
}: {
  product: ProductPublic
  providerName?: string
}) {
  const tags = product.tags ?? []
  const description = product.description?.trim()

  return (
    <div className="space-y-3">
      <FormSection title="Imagen">
        <FormFieldCell fullWidth>
          <Field>
            <FieldLabel>Imagen del producto</FieldLabel>
            <Thumbnail
              src={product.image_url}
              alt={product.name}
              size="xl"
              fallbackIcon={Package}
            />
          </Field>
        </FormFieldCell>
      </FormSection>

      <FormSection title="Datos del producto">
        <DetailField label="Nombre" fullWidth>
          {product.name} ({product.public_code})
        </DetailField>

        {providerName !== undefined ? (
          <DetailField label="Proveedor" fullWidth>
            {providerName}
          </DetailField>
        ) : null}

        <DetailField label={providerName !== undefined ? 'Precio del proveedor' : 'Precio'}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="tabular-nums">{formatMoney(product.price)}</span>
            {providerName !== undefined && !product.sale_price ? (
              <SellerProductPriceBadge product={product} />
            ) : null}
          </div>
        </DetailField>

        {providerName !== undefined && product.sale_price ? (
          <DetailField label="Tu precio de venta">
            <div className="flex flex-wrap items-center gap-2">
              <span className="tabular-nums">{formatMoney(product.sale_price)}</span>
              <SellerProductPriceBadge product={product} />
            </div>
          </DetailField>
        ) : null}

        <DetailField label="Comisión">
          <CommissionValue
            hasCommission={product.has_commission}
            commission={product.commission}
          />
        </DetailField>

        <DetailField label="Etiquetas" fullWidth>
          <BadgeList
            items={tags.map((tag) => ({
              id: tag.id,
              label: tag.name,
            }))}
          />
        </DetailField>

        <DetailField label="Descripción" fullWidth>
          {description ? (
            <p className="whitespace-pre-wrap">{description}</p>
          ) : (
            '—'
          )}
        </DetailField>
      </FormSection>

      <FormSection title="Inventario">
        <DetailField label="Stock">
          <span className="tabular-nums">{Number(product.stock)}</span>
        </DetailField>
        <DetailField label="Reservado">
          <span className="tabular-nums">{Number(product.reserved)}</span>
        </DetailField>
        <DetailField label="Creado">
          {formatDateTime(product.created_at)}
        </DetailField>
        <DetailField label="Actualizado">
          {product.updated_at ? formatDateTime(product.updated_at) : '—'}
        </DetailField>
      </FormSection>
    </div>
  )
}

function ProductDetailLayout({
  isLoading,
  isError,
  product,
  backTo = '/products',
  description = 'Detalle del producto.',
  buttons,
  children,
  providerName,
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
      title={`${product.name} (${product.public_code})`}
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
        <ProductDetailBody product={product} providerName={providerName} />
        {children}
      </div>
    </PageWrapper>
  )
}

/** Provider product detail — omits Proveedor. */
export function ProductDetailPage(props: ProductDetailPageProps) {
  return <ProductDetailLayout {...props} />
}

/** Seller product detail — includes Proveedor after Nombre. */
export function SellerProductDetailPage({
  getProviderName,
  ...props
}: SellerProductDetailPageProps) {
  const providerName = props.product
    ? getProviderName(props.product.organization_id)
    : undefined

  return <ProductDetailLayout {...props} providerName={providerName} />
}
