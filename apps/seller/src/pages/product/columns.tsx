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
  SellerProductPriceBadge,
  textColumn,
  updatedAtColumn,
  type ColumnDef,
} from '@broker/ui'
import { Eye } from 'lucide-react'

import { ProductCartControl } from '@/components/product-cart-control'

export type BuildProductColumnsOptions = {
  providerNameById: Map<string, string>
  searchTerm?: string
}

export function buildProductColumns({
  providerNameById,
  searchTerm,
}: BuildProductColumnsOptions): ColumnDef<ProductPublic>[] {
  return [
    textColumn<ProductPublic>({ id: 'public_code', header: 'Código' }),
    imageColumn<ProductPublic>({
      src: (row) => row.image_url,
      alt: (row) => row.name,
    }),
    textColumn<ProductPublic>({ id: 'name', header: 'Nombre' }),
    componentColumn<ProductPublic>('provider', 'Proveedor', (row) => (
      <span>{providerNameById.get(row.organization_id) ?? '—'}</span>
    )),
    componentColumn<ProductPublic>('price', 'Precio', (row) => (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="tabular-nums">
          {formatMoney(row.sale_price ?? row.price)}
        </span>
        <SellerProductPriceBadge product={row} />
      </div>
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
      (row) => <ProductCartControl product={row} searchTerm={searchTerm} />,
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
