import type { PhoneBlacklistListItem } from '@broker/api'
import { Link } from 'react-router-dom'

import { Badge } from '../components/ui/badge'
import type { ColumnDef } from '../components/data-table/types'
import { BtnList } from '../components/btn-list'
import {
  actionsColumn,
  createdAtColumn,
  DeleteRowButton,
  textColumn,
} from '../crud'
import {
  communityEvaluationLabel,
  phoneBlacklistReasonLabel,
} from './phone-blacklist-labels'

export type BuildPhoneBlacklistColumnsOptions = {
  onRemove: (item: PhoneBlacklistListItem) => unknown | Promise<unknown>
  isRemoving?: boolean
  customerHref?: (customerId: string) => string | undefined
}

export function buildPhoneBlacklistColumns({
  onRemove,
  isRemoving = false,
  customerHref,
}: BuildPhoneBlacklistColumnsOptions): ColumnDef<PhoneBlacklistListItem>[] {
  return [
    textColumn<PhoneBlacklistListItem>({
      id: 'phone',
      header: 'Teléfono',
    }),
    {
      id: 'customer',
      header: 'Cliente',
      cell: (row) => {
        const customer = row.customer
        if (!customer) {
          return <span className="text-muted-foreground">—</span>
        }
        const href = customerHref?.(customer.id)
        if (href) {
          return (
            <Link to={href} className="text-primary hover:underline">
              {customer.name}
            </Link>
          )
        }
        return <span>{customer.name}</span>
      },
    },
    {
      id: 'community',
      header: 'Comunidad',
      cell: (row) => (
        <Badge variant={row.other_count && row.other_count > 0 ? 'secondary' : 'outline'}>
          {communityEvaluationLabel(row.other_count ?? 0)}
        </Badge>
      ),
    },
    {
      id: 'reason',
      header: 'Motivo',
      cell: (row) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <span>{phoneBlacklistReasonLabel(row.reason)}</span>
          {row.note ? (
            <span className="truncate text-xs text-muted-foreground" title={row.note}>
              {row.note}
            </span>
          ) : null}
        </div>
      ),
    },
    createdAtColumn<PhoneBlacklistListItem>({ header: 'Agregado' }),
    actionsColumn<PhoneBlacklistListItem>((row) => (
      <BtnList>
        <DeleteRowButton
          aria-label={`Quitar ${row.phone} de la lista negra`}
          title="Quitar de la lista negra"
          confirmLabel="Quitar"
          itemLabel={row.phone}
          description={`¿Quitar «${row.phone}» de tu lista negra? Otras organizaciones no se ven afectadas.`}
          onDelete={() => onRemove(row)}
          isLoading={isRemoving}
        />
      </BtnList>
    )),
  ]
}
