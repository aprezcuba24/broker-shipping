import type { PhoneBlacklistListItem } from '@broker/api'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
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

/** Rough cut for ~2 lines of table cell text; longer values get "Ver más". */
const MODUS_OPERANDI_PREVIEW_CHARS = 80

export type BuildPhoneBlacklistColumnsOptions = {
  onRemove: (item: PhoneBlacklistListItem) => unknown | Promise<unknown>
  isRemoving?: boolean
  customerHref?: (customerId: string) => string | undefined
  /** When set, only rows from this organization show the remove action. */
  activeOrganizationId?: string
}

function ModusOperandiCell({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const needsExpand = text.length > MODUS_OPERANDI_PREVIEW_CHARS

  return (
    <div className="min-w-0">
      <p
        className={
          needsExpand
            ? 'line-clamp-2 text-xs text-muted-foreground'
            : 'text-xs text-muted-foreground'
        }
      >
        {text}
      </p>
      {needsExpand ? (
        <>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-0 py-0 text-xs"
            onClick={() => setOpen(true)}
          >
            Ver más
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Modus operandi</DialogTitle>
              </DialogHeader>
              <p className="whitespace-pre-wrap text-sm text-on-surface">{text}</p>
            </DialogContent>
          </Dialog>
        </>
      ) : null}
    </div>
  )
}

export function buildPhoneBlacklistColumns({
  onRemove,
  isRemoving = false,
  customerHref,
  activeOrganizationId,
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
          {row.modus_operandi ? <ModusOperandiCell text={row.modus_operandi} /> : null}
        </div>
      ),
    },
    createdAtColumn<PhoneBlacklistListItem>({ header: 'Agregado' }),
    actionsColumn<PhoneBlacklistListItem>((row) => {
      const canRemove =
        activeOrganizationId == null || row.organization_id === activeOrganizationId
      if (!canRemove) {
        return null
      }
      return (
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
      )
    }),
  ]
}
