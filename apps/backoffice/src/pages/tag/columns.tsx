import type { TagPublic } from '@broker/api'
import {
  actionsColumn,
  booleanColumn,
  BtnList,
  createdAtColumn,
  DeleteRowButton,
  EditRowButton,
  textColumn,
  updatedAtColumn,
  type ColumnDef,
} from '@broker/ui'

export type BuildTagColumnsOptions = {
  onEdit: (item: TagPublic) => void
  onDelete: (item: TagPublic) => unknown | Promise<unknown>
  isDeleting?: boolean
}

export function buildTagColumns({
  onEdit,
  onDelete,
  isDeleting = false,
}: BuildTagColumnsOptions): ColumnDef<TagPublic>[] {
  return [
    textColumn<TagPublic>({ id: 'name', header: 'Nombre' }),
    booleanColumn<TagPublic>({ id: 'is_active', header: 'Activo' }),
    createdAtColumn<TagPublic>(),
    updatedAtColumn<TagPublic>(),
    actionsColumn<TagPublic>((row) => (
      <BtnList>
        <EditRowButton aria-label={`Editar ${row.name}`} onEdit={() => onEdit(row)} />
        <DeleteRowButton
          aria-label={`Eliminar ${row.name}`}
          title="Eliminar etiqueta"
          itemLabel={row.name}
          onDelete={() => onDelete(row)}
          isLoading={isDeleting}
        />
      </BtnList>
    )),
  ]
}
