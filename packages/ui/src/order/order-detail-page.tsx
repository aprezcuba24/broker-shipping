import { formatDateTime, type OrderPublic } from '@broker/api'
import { ClipboardList, ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'

import { BtnLink } from '../components/btn-link'
import {
  DetailSection,
  type DetailSectionField,
} from '../components/detail-section'
import { PageLoading } from '../components/page-loading'
import { PageMessage } from '../components/page-message'
import { PageWrapper } from '../components/page-wrapper'
import { PhoneReputation } from '../customer/phone-reputation'
import { formatMoney } from '../lib/utils'
import { OrderStatusBadge } from './status'

const orderDetailCodeField: DetailSectionField<OrderPublic> = {
  title: 'Código',
  accessor: (order) => order.code,
}

const orderDetailStatusField: DetailSectionField<OrderPublic> = {
  title: 'Estado',
  accessor: (order) => order.status,
  format: (value) => <OrderStatusBadge status={value as OrderPublic['status']} />,
}

const orderDetailCreatedField: DetailSectionField<OrderPublic> = {
  title: 'Creada',
  accessor: (order) => order.created_at,
  format: (value) => formatDateTime(value as string),
}

const orderDetailSellerField: DetailSectionField<OrderPublic> = {
  title: 'Vendedor',
  accessor: (order) => order.seller_organization?.name,
}

const orderDetailTotalsField: DetailSectionField<OrderPublic> = {
  title: 'Totales',
  accessor: (order) => order.totals,
  fullWidth: true,
  format: (value) => {
    const totals = value as OrderPublic['totals']
    if (!totals || totals.length === 0) return '—'
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1 font-medium tabular-nums">
        {totals.map((total) => (
          <div key={total.currency}>
            {formatMoney(total.amount, total.currency)}
          </div>
        ))}
      </div>
    )
  },
}

/** Provider (backoffice) summary fields — includes seller. */
export const orderDetailBaseFields: DetailSectionField<OrderPublic>[] = [
  orderDetailCodeField,
  orderDetailStatusField,
  orderDetailCreatedField,
  orderDetailSellerField,
  orderDetailTotalsField,
]

/** Seller summary fields — no seller column (viewer is the seller). */
export const orderDetailSellerBaseFields: DetailSectionField<OrderPublic>[] = [
  orderDetailCodeField,
  orderDetailStatusField,
  orderDetailCreatedField,
  orderDetailTotalsField,
]

export const orderDetailCustomerFields: DetailSectionField<OrderPublic>[] = [
  {
    title: 'Nombre',
    accessor: (order) => order.customer?.name,
  },
  {
    title: 'Teléfono',
    accessor: (order) => order.customer?.phone,
  },
  {
    title: 'CI',
    accessor: (order) => order.customer?.ci,
  },
  {
    title: 'Dirección',
    accessor: (order) => order.customer?.address?.address,
    fullWidth: true,
  },
  {
    title: 'Calificación',
    accessor: (order) => order,
    fullWidth: true,
    format: (value) => {
      const order = value as OrderPublic
      const phone = order.customer?.phone
      if (!phone) return '—'
      return (
        <PhoneReputation
          phone={phone}
          tier={order.customer?.purchase_tier ?? 0}
        />
      )
    },
  },
]

export type OrderDetailPageProps = {
  isLoading: boolean
  isError: boolean
  order: OrderPublic | undefined
  backTo?: string
  description?: string
  topContent?: ReactNode
  children?: ReactNode
}

type OrderDetailLayoutProps = OrderDetailPageProps & {
  summaryFields: DetailSectionField<OrderPublic>[]
}

function OrderDetailLayout({
  isLoading,
  isError,
  order,
  backTo = '/orders',
  description = 'Detalle de la orden.',
  topContent,
  children,
  summaryFields,
}: OrderDetailLayoutProps) {
  if (isLoading) {
    return <PageLoading title="Orden" />
  }

  if (isError || !order) {
    return (
      <PageMessage
        title="Orden no encontrada"
        message="No se pudo cargar la orden solicitada."
        icon={ClipboardList}
        backTo={backTo}
      />
    )
  }

  return (
    <PageWrapper
      title={order.code}
      description={description}
      icon={ClipboardList}
      leading={
        <BtnLink
          to={backTo}
          variant="outline"
          size="icon-sm"
          icon={ArrowLeft}
          aria-label="Volver a órdenes"
        />
      }
    >
      <div className="space-y-6">
        {topContent}
        <DetailSection title="Resumen" data={order} fields={summaryFields} />
        <DetailSection title="Cliente" data={order} fields={orderDetailCustomerFields} />
        {children}
      </div>
    </PageWrapper>
  )
}

/** Provider order detail — Resumen includes Vendedor. */
export function OrderDetailPage(props: OrderDetailPageProps) {
  return <OrderDetailLayout {...props} summaryFields={orderDetailBaseFields} />
}

/** Seller order detail — Resumen omits Vendedor. */
export function SellerOrderDetailPage(props: OrderDetailPageProps) {
  return (
    <OrderDetailLayout {...props} summaryFields={orderDetailSellerBaseFields} />
  )
}
