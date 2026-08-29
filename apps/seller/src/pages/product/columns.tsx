import type { ProductPublic } from '@broker/api'
import {
  actionsColumn,
  BadgeList,
  BtnList,
  Button,
  componentColumn,
  createdAtColumn,
  currencyMoneyColumn,
  imageColumn,
  textColumn,
  updatedAtColumn,
  type ColumnDef,
} from '@broker/ui'
import { Eye } from 'lucide-react'

import { ProductCartControl } from '@/components/product-cart-control'

export type BuildProductColumnsOptions = {
  providerNameById: Map<string, string>
  onView: (item: ProductPublic) => void
}

export function buildProductColumns({
  providerNameById,
  onView,
}: BuildProductColumnsOptions): ColumnDef<ProductPublic>[] {
  return [
    imageColumn<ProductPublic>({
      src: (row) => row.image_url,
      alt: (row) => row.name,
    }),
    textColumn<ProductPublic>({ id: 'name', header: 'Nombre' }),
    componentColumn<ProductPublic>('provider', 'Proveedor', (row) => (
      <span>{providerNameById.get(row.organization_id) ?? '—'}</span>
    )),
    currencyMoneyColumn<ProductPublic>({ id: 'price', header: 'Precio' }),
    currencyMoneyColumn<ProductPublic>({ id: 'commission', header: 'Comisión' }),
    componentColumn<ProductPublic>('tags', 'Etiquetas', (row) => (
      <BadgeList
        items={(row.tags ?? []).map((tag) => ({ id: tag.id, label: tag.name }))}
      />
    ), { hideOn: 'sm' }),
    createdAtColumn<ProductPublic>({ hideInCard: true }),
    updatedAtColumn<ProductPublic>({ hideInCard: true }),
    componentColumn<ProductPublic>(
      'cart',
      'Carrito',
      (row) => <ProductCartControl product={row} />,
      { cardFooter: true },
    ),
    actionsColumn<ProductPublic>((row) => (
      <BtnList>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          icon={Eye}
          aria-label={`Ver ${row.name}`}
          onClick={() => onView(row)}
        />
      </BtnList>
    )),
  ]
}
