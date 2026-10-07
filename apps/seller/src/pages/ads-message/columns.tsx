import type { AdsMessagePublic } from '@broker/api'
import {
  actionsColumn,
  BtnLink,
  BtnList,
  createdAtColumn,
  DeleteRowButton,
  imageColumn,
  textColumn,
  updatedAtColumn,
  type ColumnDef,
} from '@broker/ui'
import { Pencil } from 'lucide-react'

export type BuildAdsMessageColumnsOptions = {
  onDelete: (item: AdsMessagePublic) => unknown | Promise<unknown>
  isDeleting?: boolean
}

export function buildAdsMessageColumns({
  onDelete,
  isDeleting = false,
}: BuildAdsMessageColumnsOptions): ColumnDef<AdsMessagePublic>[] {
  return [
    textColumn<AdsMessagePublic>({ id: 'code', header: 'Código' }),
    imageColumn<AdsMessagePublic>({
      src: (row) => row.photo_url,
      alt: (row) => row.title,
    }),
    textColumn<AdsMessagePublic>({ id: 'title', header: 'Título' }),
    textColumn<AdsMessagePublic>({
      id: 'description',
      header: 'Descripción',
      hideInCard: true,
      hideOn: 'md',
    }),
    createdAtColumn<AdsMessagePublic>({ hideInCard: true }),
    updatedAtColumn<AdsMessagePublic>({ hideInCard: true }),
    actionsColumn<AdsMessagePublic>((row) => (
      <BtnList>
        <BtnLink
          to={`/ads-messages/${row.id}/edit`}
          variant="ghost"
          size="sm"
          icon={Pencil}
          aria-label={`Editar ${row.title}`}
        >
          Editar
        </BtnLink>
        <DeleteRowButton
          aria-label={`Eliminar ${row.title}`}
          title="Eliminar anuncio"
          itemLabel={row.title}
          onDelete={() => onDelete(row)}
          isLoading={isDeleting}
        />
      </BtnList>
    )),
  ]
}
