import type { NeighborhoodPublic } from '@broker/api'
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

export type BuildNeighborhoodColumnsOptions = {
  onEdit: (item: NeighborhoodPublic) => void
  onDelete: (item: NeighborhoodPublic) => unknown | Promise<unknown>
  isDeleting?: boolean
}

export function buildNeighborhoodColumns({
  onEdit,
  onDelete,
  isDeleting = false,
}: BuildNeighborhoodColumnsOptions): ColumnDef<NeighborhoodPublic>[] {
  return [
    textColumn<NeighborhoodPublic>({ id: 'name', header: 'Nombre' }),
    textColumn<NeighborhoodPublic>({ id: 'municipality_name', header: 'Municipio' }),
    textColumn<NeighborhoodPublic>({ id: 'province_name', header: 'Provincia' }),
    createdAtColumn<NeighborhoodPublic>(),
    updatedAtColumn<NeighborhoodPublic>(),
    actionsColumn<NeighborhoodPublic>((row) => (
      <BtnList>
        <EditRowButton aria-label={`Editar ${row.name}`} onEdit={() => onEdit(row)} />
        <DeleteRowButton
          aria-label={`Eliminar ${row.name}`}
          title="Eliminar barrio"
          itemLabel={row.name}
          onDelete={() => onDelete(row)}
          isLoading={isDeleting}
        />
      </BtnList>
    )),
  ]
}
