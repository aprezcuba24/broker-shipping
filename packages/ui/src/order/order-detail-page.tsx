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
import { formatMoney } from '../lib/utils'
import { OrderStatusBadge } from './status'

export const orderDetailBaseFields: DetailSectionField<OrderPublic>[] = [
  {
    title: 'Código',
    accessor: (order) => order.code,
  },
  {
    title: 'Estado',
    accessor: (order) => order.status,
    format: (value) => <OrderStatusBadge status={value as OrderPublic['status']} />,
  },
  {
    title: 'Creada',
    accessor: (order) => order.created_at,
    format: (value) => formatDateTime(value as string),
  },
  {
    title: 'Totales',
    accessor: (order) => order.totals,
    format: (value) => {
      const totals = value as OrderPublic['totals']
      if (!totals || totals.length === 0) return '—'
      return (
        <div className="space-y-0.5 font-medium tabular-nums">
          {totals.map((total) => (
            <div key={total.currency}>
              {formatMoney(total.amount, total.currency)}
            </div>
          ))}
        </div>
      )
    },
  },
]

export const orderDetailCustomerFields: DetailSectionField<OrderPublic>[] = [
  {
    title: 'Cliente',
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
  },
]

export type OrderDetailPageProps = {
  isLoading: boolean
  isError: boolean
  order: OrderPublic | undefined
  backTo?: string
  description?: string
  extraFields?: DetailSectionField<OrderPublic>[]
  children?: ReactNode
}

export function OrderDetailPage({
  isLoading,
  isError,
  order,
  backTo = '/orders',
  description = 'Detalle de la orden.',
  extraFields = [],
  children,
}: OrderDetailPageProps) {
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

  const fields = [...orderDetailBaseFields, ...extraFields]

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
        <DetailSection title="Resumen" data={order} fields={fields} />
        {children}
      </div>
    </PageWrapper>
  )
}
