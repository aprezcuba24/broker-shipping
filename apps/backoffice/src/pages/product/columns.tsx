import type { ProductProviderPublic } from '@broker/api'
import {
  actionsColumn,
  BadgeList,
  BtnLink,
  BtnList,
  CommissionValue,
  componentColumn,
  createdAtColumn,
  currencyMoneyColumn,
  DeleteRowButton,
  imageColumn,
  numberColumn,
  textColumn,
  updatedAtColumn,
  type ColumnDef,
} from '@broker/ui'
import { Eye } from 'lucide-react'

export type BuildProductColumnsOptions = {
  onDelete: (item: ProductProviderPublic) => unknown | Promise<unknown>
  isDeleting?: boolean
}

export function buildProductColumns({
  onDelete,
  isDeleting = false,
}: BuildProductColumnsOptions): ColumnDef<ProductProviderPublic>[] {
  return [
    textColumn<ProductProviderPublic>({ id: 'public_code', header: 'Código' }),
    imageColumn<ProductProviderPublic>({
      src: (row) => row.image_url,
      alt: (row) => row.name,
    }),
    textColumn<ProductProviderPublic>({ id: 'name', header: 'Nombre' }),
    currencyMoneyColumn<ProductProviderPublic>({ id: 'price', header: 'Precio' }),
    componentColumn<ProductProviderPublic>('commission', 'Comisión', (row) => (
      <CommissionValue
        hasCommission={row.has_commission}
        commission={row.commission}
      />
    )),
    numberColumn<ProductProviderPublic>({ id: 'stock', header: 'Stock' }),
    numberColumn<ProductProviderPublic>({ id: 'reserved', header: 'Reservado' }),
    componentColumn<ProductProviderPublic>('tags', 'Etiquetas', (row) => (
      <BadgeList
        items={(row.tags ?? []).map((tag) => ({ id: tag.id, label: tag.name }))}
      />
    ), { hideOn: 'sm' }),
    createdAtColumn<ProductProviderPublic>({ hideInCard: true }),
    updatedAtColumn<ProductProviderPublic>({ hideInCard: true }),
    actionsColumn<ProductProviderPublic>((row) => (
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
