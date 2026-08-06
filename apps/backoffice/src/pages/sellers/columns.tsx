import type { LinkedSellerPublic } from '@broker/api'
import {
  actionsColumn,
  Badge,
  BtnList,
  Button,
  componentColumn,
  createdAtColumn,
  DeleteRowButton,
  textColumn,
  type ColumnDef,
} from '@broker/ui'
import { Unlink } from 'lucide-react'

export type BuildLinkedSellerColumnsOptions = {
  onUnlink: (seller: LinkedSellerPublic) => unknown | Promise<unknown>
  isUnlinking?: boolean
  unlinkingSellerId?: string | null
}

export function buildLinkedSellerColumns({
  onUnlink,
  isUnlinking = false,
  unlinkingSellerId = null,
}: BuildLinkedSellerColumnsOptions): ColumnDef<LinkedSellerPublic>[] {
  return [
    textColumn<LinkedSellerPublic>({ id: 'name', header: 'Nombre' }),
    componentColumn<LinkedSellerPublic>('commissions', 'Comisiones', (row) =>
      row.has_pending_commissions ? (
        <Badge variant="secondary">Pendientes</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
    ),
    createdAtColumn<LinkedSellerPublic>(),
    actionsColumn<LinkedSellerPublic>((row) => {
      const rowBusy = isUnlinking && unlinkingSellerId === row.id
      if (row.has_pending_commissions) {
        return (
          <BtnList>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled
              title="No se puede desvincular mientras existan comisiones pendientes de pago"
              aria-label={`No se puede desvincular ${row.name}: hay comisiones pendientes`}
            >
              <Unlink className="h-4 w-4 text-muted-foreground" />
            </Button>
          </BtnList>
        )
      }
      return (
        <BtnList>
          <DeleteRowButton
            aria-label={`Desvincular ${row.name}`}
            title="Desvincular organización"
            description={`¿Seguro que deseas desvincular «${row.name}»? Dejará de poder operar contigo.`}
            confirmLabel="Desvincular"
            onDelete={() => onUnlink(row)}
            isLoading={rowBusy}
            disabled={isUnlinking && !rowBusy}
          >
            <Unlink className="h-4 w-4 text-destructive" />
          </DeleteRowButton>
        </BtnList>
      )
    }),
  ]
}
