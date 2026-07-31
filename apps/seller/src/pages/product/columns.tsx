import type { ProductPublic } from '@broker/api'
import {
  actionsColumn,
  BadgeList,
  BtnList,
  Button,
  componentColumn,
  createdAtColumn,
  textColumn,
  updatedAtColumn,
  type ColumnDef,
} from '@broker/ui'
import { Eye } from 'lucide-react'

export type BuildProductColumnsOptions = {
  providerNameById: Map<string, string>
  onView: (item: ProductPublic) => void
}

export function buildProductColumns({
  providerNameById,
  onView,
}: BuildProductColumnsOptions): ColumnDef<ProductPublic>[] {
  return [
    textColumn<ProductPublic>({ id: 'name', header: 'Nombre' }),
    componentColumn<ProductPublic>('provider', 'Proveedor', (row) => (
      <span>{providerNameById.get(row.organization_id) ?? '—'}</span>
    )),
    componentColumn<ProductPublic>('tags', 'Etiquetas', (row) => (
      <BadgeList
        items={(row.tags ?? []).map((tag) => ({ id: tag.id, label: tag.name }))}
      />
    )),
    createdAtColumn<ProductPublic>(),
    updatedAtColumn<ProductPublic>(),
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
