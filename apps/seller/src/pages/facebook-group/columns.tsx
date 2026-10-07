import type { FacebookGroupPublic } from '@broker/api'
import {
  actionsColumn,
  BtnList,
  createdAtColumn,
  DeleteRowButton,
  EditRowButton,
  textColumn,
  updatedAtColumn,
  type ColumnDef,
} from '@broker/ui'

export type BuildFacebookGroupColumnsOptions = {
  onEdit: (item: FacebookGroupPublic) => void
  onDelete: (item: FacebookGroupPublic) => unknown | Promise<unknown>
  isDeleting?: boolean
}

export function buildFacebookGroupColumns({
  onEdit,
  onDelete,
  isDeleting = false,
}: BuildFacebookGroupColumnsOptions): ColumnDef<FacebookGroupPublic>[] {
  return [
    textColumn<FacebookGroupPublic>({ id: 'name', header: 'Nombre' }),
    textColumn<FacebookGroupPublic>({ id: 'facebook_id', header: 'ID Facebook' }),
    createdAtColumn<FacebookGroupPublic>(),
    updatedAtColumn<FacebookGroupPublic>(),
    actionsColumn<FacebookGroupPublic>((row) => (
      <BtnList>
        <EditRowButton
          aria-label={`Editar ${row.name}`}
          onEdit={() => onEdit(row)}
        />
        <DeleteRowButton
          aria-label={`Eliminar ${row.name}`}
          title="Eliminar grupo"
          itemLabel={row.name}
          onDelete={() => onDelete(row)}
          isLoading={isDeleting}
        />
      </BtnList>
    )),
  ]
}
