import type { InvitationPublic } from '@broker/api'
import { Button } from '../components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'

export type SellerLinkRequestsListProps = {
  invitations: InvitationPublic[]
  isLoading?: boolean
  onAccept: (invitationId: string) => void | Promise<void>
  onReject: (invitationId: string) => void | Promise<void>
  pendingId?: string | null
}

export function SellerLinkRequestsList({
  invitations,
  isLoading = false,
  onAccept,
  onReject,
  pendingId = null,
}: SellerLinkRequestsListProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando solicitudes…</p>
  }

  const requests = invitations.filter((inv) => inv.kind === 'seller_link_request')

  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay solicitudes pendientes.</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Org. vendedora</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((inv) => (
          <TableRow key={inv.id}>
            <TableCell className="font-mono text-xs">
              {inv.counterparty_organization_id ?? '—'}
            </TableCell>
            <TableCell>{inv.kind}</TableCell>
            <TableCell className="text-right space-x-2">
              <Button
                type="button"
                size="sm"
                disabled={pendingId === inv.id}
                onClick={() => void onAccept(inv.id)}
              >
                Aprobar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pendingId === inv.id}
                onClick={() => void onReject(inv.id)}
              >
                Rechazar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
