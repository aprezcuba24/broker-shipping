import type { ProvincePublic } from '@broker/api'
import { BtnList } from '../../components/btn-list'
import type { ColumnDef } from '../../components/data-table/types'
import {
  actionsColumn,
  createdAtColumn,
  textColumn,
  updatedAtColumn,
} from '../../crud/components/columns'
import { DeleteRowButton } from '../../crud/components/delete-row-button'
import { EditRowButton } from '../../crud/components/edit-row-button'

export type BuildProvinceColumnsOptions = {
  onEdit: (item: ProvincePublic) => void
  onDelete: (item: ProvincePublic) => unknown | Promise<unknown>
  isDeleting?: boolean
}

export function buildProvinceColumns({
  onEdit,
  onDelete,
  isDeleting = false,
}: BuildProvinceColumnsOptions): ColumnDef<ProvincePublic>[] {
  return [
    textColumn<ProvincePublic>({ id: 'name', header: 'Nombre' }),
    createdAtColumn<ProvincePublic>(),
    updatedAtColumn<ProvincePublic>(),
    actionsColumn<ProvincePublic>((row) => (
      <BtnList>
        <EditRowButton aria-label={`Editar ${row.name}`} onEdit={() => onEdit(row)} />
        <DeleteRowButton
          aria-label={`Eliminar ${row.name}`}
          title="Eliminar provincia"
          itemLabel={row.name}
          onDelete={() => onDelete(row)}
          isLoading={isDeleting}
        />
      </BtnList>
    )),
  ]
}
