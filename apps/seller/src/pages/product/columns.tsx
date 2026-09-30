import type { ProductPublic } from '@broker/api'
import {
  actionsColumn,
  BadgeList,
  BtnLink,
  BtnList,
  CommissionValue,
  componentColumn,
  createdAtColumn,
  formatMoney,
  imageColumn,
  textColumn,
  updatedAtColumn,
  type ColumnDef,
} from '@broker/ui'
import { Eye } from 'lucide-react'

import { ProductCartControl } from '@/components/product-cart-control'

export type BuildProductColumnsOptions = {
  providerNameById: Map<string, string>
}

export function buildProductColumns({
  providerNameById,
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
    componentColumn<ProductPublic>('price', 'Precio', (row) => (
      <span className="tabular-nums">
        {formatMoney(row.sale_price ?? row.price)}
      </span>
    )),
    componentColumn<ProductPublic>('commission', 'Comisión', (row) => (
      <CommissionValue
        hasCommission={row.has_commission}
        commission={row.commission}
      />
    )),
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
        <BtnLink
          to={`/products/${row.id}`}
          variant="ghost"
          size="sm"
          icon={Eye}
          aria-label={`Ver ${row.name}`}
        >
          Ver
        </BtnLink>
      </BtnList>
    )),
  ]
}
