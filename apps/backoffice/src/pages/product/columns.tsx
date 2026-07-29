import type { ProductPublic } from '@broker/api'
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

export type BuildProductColumnsOptions = {
  onEdit: (item: ProductPublic) => void
  onDelete: (item: ProductPublic) => unknown | Promise<unknown>
  isDeleting?: boolean
}

export function buildProductColumns({
  onEdit,
  onDelete,
  isDeleting = false,
}: BuildProductColumnsOptions): ColumnDef<ProductPublic>[] {
  return [
    textColumn<ProductPublic>({ id: 'name', header: 'Nombre' }),
    createdAtColumn<ProductPublic>(),
    updatedAtColumn<ProductPublic>(),
    actionsColumn<ProductPublic>((row) => (
      <BtnList>
        <EditRowButton aria-label={`Editar ${row.name}`} onEdit={() => onEdit(row)} />
        <DeleteRowButton
          aria-label={`Eliminar ${row.name}`}
          title="Eliminar producto"
          itemLabel={row.name}
          onDelete={() => onDelete(row)}
          isLoading={isDeleting}
        />
      </BtnList>
    )),
  ]
}
