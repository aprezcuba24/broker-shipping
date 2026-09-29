import type { MunicipalityPublic } from '@broker/api'
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

export type BuildMunicipalityColumnsOptions = {
  onEdit: (item: MunicipalityPublic) => void
  onDelete: (item: MunicipalityPublic) => unknown | Promise<unknown>
  isDeleting?: boolean
}

export function buildMunicipalityColumns({
  onEdit,
  onDelete,
  isDeleting = false,
}: BuildMunicipalityColumnsOptions): ColumnDef<MunicipalityPublic>[] {
  return [
    textColumn<MunicipalityPublic>({ id: 'name', header: 'Nombre' }),
    textColumn<MunicipalityPublic>({ id: 'province_name', header: 'Provincia' }),
    createdAtColumn<MunicipalityPublic>(),
    updatedAtColumn<MunicipalityPublic>(),
    actionsColumn<MunicipalityPublic>((row) => (
      <BtnList>
        <EditRowButton aria-label={`Editar ${row.name}`} onEdit={() => onEdit(row)} />
        <DeleteRowButton
          aria-label={`Eliminar ${row.name}`}
          title="Eliminar municipio"
          itemLabel={row.name}
          onDelete={() => onDelete(row)}
          isLoading={isDeleting}
        />
      </BtnList>
    )),
  ]
}
