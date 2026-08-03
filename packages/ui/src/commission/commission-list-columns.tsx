import type { CommissionPublic } from '@broker/api'
import { Eye } from 'lucide-react'

import { BtnLink } from '../components/btn-link'
import { BtnList } from '../components/btn-list'
import type { ColumnDef } from '../components/data-table/types'
import {
  actionsColumn,
  componentColumn,
  createdAtColumn,
  currencyMoneyColumn,
} from '../crud/components/columns'
import { CommissionPaidBadge } from './status'

function buildSharedCommissionColumns({
  counterpartyHeader,
  getCounterpartyId,
  getCounterpartyName,
}: {
  counterpartyHeader: string
  getCounterpartyId: (row: CommissionPublic) => string
  getCounterpartyName: (organizationId: string) => string
}): ColumnDef<CommissionPublic>[] {
  return [
    componentColumn<CommissionPublic>('counterparty', counterpartyHeader, (row) => (
      <span>{getCounterpartyName(getCounterpartyId(row))}</span>
    )),
    currencyMoneyColumn<CommissionPublic>({
      id: 'amount',
      header: 'Monto',
      accessor: 'amount',
    }),
    componentColumn<CommissionPublic>('is_paid', 'Estado', (row) => (
      <CommissionPaidBadge isPaid={row.is_paid} />
    )),
    componentColumn<CommissionPublic>('order_id', 'Orden', (row) => (
      <BtnLink
        to={`/orders/${row.order_id}`}
        variant="link"
        size="sm"
        className="h-auto px-0 font-mono text-xs"
      >
        Ver orden
      </BtnLink>
    )),
    createdAtColumn<CommissionPublic>({ header: 'Creada' }),
    actionsColumn<CommissionPublic>((row) => (
      <BtnList>
        <BtnLink
          to={`/commissions/${row.id}`}
          variant="ghost"
          size="sm"
          icon={Eye}
          aria-label="Ver comisión"
        >
          Ver
        </BtnLink>
      </BtnList>
    )),
  ]
}

export function buildSellerCommissionColumns({
  getProviderName,
}: {
  getProviderName: (organizationId: string) => string
}): ColumnDef<CommissionPublic>[] {
  return buildSharedCommissionColumns({
    counterpartyHeader: 'Proveedor',
    getCounterpartyId: (row) => row.provider_organization_id,
    getCounterpartyName: getProviderName,
  })
}

export function buildProviderCommissionColumns({
  getSellerName,
}: {
  getSellerName: (organizationId: string) => string
}): ColumnDef<CommissionPublic>[] {
  return buildSharedCommissionColumns({
    counterpartyHeader: 'Vendedor',
    getCounterpartyId: (row) => row.seller_organization_id,
    getCounterpartyName: getSellerName,
  })
}
