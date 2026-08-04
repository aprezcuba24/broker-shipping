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
    componentColumn<InvitationPublic>('provider', 'Proveedor', (row) => (
      <span className="font-mono text-xs">{row.organization_id}</span>
    )),
    createdAtColumn<InvitationPublic>({ header: 'Solicitado' }),
    componentColumn<InvitationPublic>('status', 'Estado', () => (
      <Badge variant="secondary">Pendiente</Badge>
    )),
  ]
}
