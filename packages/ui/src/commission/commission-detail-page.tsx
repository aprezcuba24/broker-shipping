import { formatDateTime, type CommissionPublic } from '@broker/api'
import { CircleDollarSign, ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { BtnLink } from '../components/btn-link'
import {
  DetailSection,
  type DetailSectionField,
} from '../components/detail-section'
import { PageLoading } from '../components/page-loading'
import { PageMessage } from '../components/page-message'
import { PageWrapper } from '../components/page-wrapper'
import { formatMoney } from '../lib/utils'
import { CommissionPaidBadge } from './status'

export function buildCommissionDetailFields({
  counterpartyLabel,
  getCounterpartyId,
  getCounterpartyName,
}: {
  counterpartyLabel: string
  getCounterpartyId: (commission: CommissionPublic) => string
  getCounterpartyName?: (organizationId: string) => string
}): DetailSectionField<CommissionPublic>[] {
  return [
    {
      title: 'Monto',
      accessor: (commission) => commission,
      format: (value) => {
        const commission = value as CommissionPublic
        return (
          <span className="font-medium tabular-nums">
            {formatMoney(commission.amount, commission.currency)}
          </span>
        )
      },
    },
    {
      title: 'Estado',
      accessor: (commission) => commission.is_paid,
      format: (value) => <CommissionPaidBadge isPaid={Boolean(value)} />,
    },
    {
      title: 'Pagada el',
      accessor: (commission) => commission.paid_at,
      format: (value) =>
        value ? formatDateTime(value as string) : '—',
    },
    {
      title: counterpartyLabel,
      accessor: (commission) => getCounterpartyId(commission),
      format: (value) =>
        getCounterpartyName
          ? getCounterpartyName(String(value))
          : String(value ?? '—'),
    },
    {
      title: 'Orden',
      accessor: (commission) => commission.order_id,
      format: (value) => (
        <Link
          to={`/orders/${String(value)}`}
          className="text-primary underline-offset-4 hover:underline"
        >
          Ver orden
        </Link>
      ),
    },
    {
      title: 'Ítems',
      accessor: (commission) => commission.order_item_ids?.length ?? 0,
      format: (value) => String(value),
    },
    {
      title: 'Creada',
      accessor: (commission) => commission.created_at,
      format: (value) => formatDateTime(value as string),
    },
  ]
}

export type CommissionDetailPageProps = {
  isLoading: boolean
  isError: boolean
  commission: CommissionPublic | undefined
  counterpartyLabel: string
  getCounterpartyId: (commission: CommissionPublic) => string
  getCounterpartyName?: (organizationId: string) => string
  backTo?: string
  description?: string
  children?: ReactNode
}

export function CommissionDetailPage({
  isLoading,
  isError,
  commission,
  counterpartyLabel,
  getCounterpartyId,
  getCounterpartyName,
  backTo = '/commissions',
  description = 'Detalle de la comisión.',
  children,
}: CommissionDetailPageProps) {
  if (isLoading) {
    return <PageLoading title="Comisión" />
  }

  if (isError || !commission) {
    return (
      <PageMessage
        title="Comisión no encontrada"
        message="No se pudo cargar la comisión solicitada."
        icon={CircleDollarSign}
        backTo={backTo}
      />
    )
  }

  const fields = buildCommissionDetailFields({
    counterpartyLabel,
    getCounterpartyId,
    getCounterpartyName,
  })

  return (
    <PageWrapper
      title={formatMoney(commission.amount, commission.currency)}
      description={description}
      icon={CircleDollarSign}
      leading={
        <BtnLink
          to={backTo}
          variant="outline"
          size="icon-sm"
          icon={ArrowLeft}
          aria-label="Volver a comisiones"
        />
      }
    >
      <div className="space-y-6">
        <DetailSection title="Resumen" data={commission} fields={fields} />
        {children}
      </div>
    </PageWrapper>
  )
}
