import type { ProductPublic } from '@broker/api'
import {
  actionsColumn,
  BadgeList,
  BtnList,
  componentColumn,
  createdAtColumn,
  currencyMoneyColumn,
  DeleteRowButton,
  EditRowButton,
  imageColumn,
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
    imageColumn<ProductPublic>({
      src: (row) => row.image_url,
      alt: (row) => row.name,
    }),
    textColumn<ProductPublic>({ id: 'name', header: 'Nombre' }),
    currencyMoneyColumn<ProductPublic>({ id: 'price', header: 'Precio' }),
    currencyMoneyColumn<ProductPublic>({ id: 'commission', header: 'Comisión' }),
    componentColumn<ProductPublic>('tags', 'Etiquetas', (row) => (
      <BadgeList
        items={(row.tags ?? []).map((tag) => ({ id: tag.id, label: tag.name }))}
      />
    )),
    createdAtColumn<ProductPublic>({ hideInCard: true }),
    updatedAtColumn<ProductPublic>({ hideInCard: true }),
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
