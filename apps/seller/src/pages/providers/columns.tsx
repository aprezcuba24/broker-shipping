import type { InvitationPublic, OrganizationPublic } from '@broker/api'
import {
  Badge,
  componentColumn,
  createdAtColumn,
  textColumn,
  type ColumnDef,
} from '@broker/ui'

export function buildLinkedProviderColumns(): ColumnDef<OrganizationPublic>[] {
  return [
    textColumn<OrganizationPublic>({ id: 'name', header: 'Nombre' }),
    createdAtColumn<OrganizationPublic>(),
  ]
}

export function buildPendingRequestColumns(): ColumnDef<InvitationPublic>[] {
  return [
    textColumn<InvitationPublic>({
      id: 'organization_name',
      header: 'Proveedor',
      cell: (row) => row.organization_name ?? '—',
    }),
    createdAtColumn<InvitationPublic>({ header: 'Solicitado' }),
    componentColumn<InvitationPublic>('status', 'Estado', () => (
      <Badge variant="secondary">Pendiente</Badge>
    )),
  ]
}
