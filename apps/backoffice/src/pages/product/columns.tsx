import type { ProductPublic } from '@broker/api'
import {
  actionsColumn,
  BadgeList,
  BtnLink,
  BtnList,
  componentColumn,
  createdAtColumn,
  currencyMoneyColumn,
  DeleteRowButton,
  imageColumn,
  textColumn,
  updatedAtColumn,
  type ColumnDef,
} from '@broker/ui'
import { Eye } from 'lucide-react'

export type BuildProductColumnsOptions = {
  onDelete: (item: ProductPublic) => unknown | Promise<unknown>
  isDeleting?: boolean
}

export function buildProductColumns({
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
    ), { hideOn: 'sm' }),
    createdAtColumn<ProductPublic>({ hideInCard: true }),
    updatedAtColumn<ProductPublic>({ hideInCard: true }),
    actionsColumn<ProductPublic>((row) => (
      <BtnList>
        <BtnLink
          to={`/products/${row.id}`}
          variant="ghost"
          size="sm"
          icon={Eye}
          aria-label={`Ver ${row.name}`}
        >
          Ver
        </BtnLink>
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
