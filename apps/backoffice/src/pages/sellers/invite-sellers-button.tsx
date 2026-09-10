import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  ShareActions,
} from '@broker/ui'
import { Link2 } from 'lucide-react'
import { useMemo, useState } from 'react'

function buildSellerInviteUrl(providerId: string): string {
  const base =
    (import.meta.env.VITE_SELLER_APP_URL as string | undefined)?.replace(/\/$/, '') ||
    'http://localhost:5174'
  return `${base}/join-provider?provider_id=${encodeURIComponent(providerId)}`
}

export type InviteSellersButtonProps = {
  providerOrganizationId: string
}

export function InviteSellersButton({
  providerOrganizationId,
}: InviteSellersButtonProps) {
  const [open, setOpen] = useState(false)
  const inviteUrl = useMemo(
    () => buildSellerInviteUrl(providerOrganizationId),
    [providerOrganizationId],
  )
  const shareText = '';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" icon={Link2} label="Invitar vendedores" />
      </DialogTrigger>
      <DialogContent className="broker-dialog sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Invitar vendedores</DialogTitle>
          <DialogDescription>
            Comparte este enlace. Quien lo use podrá solicitar vincularse a tu organización.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seller-invite-url">Enlace de solicitud</Label>
            <Input
              id="seller-invite-url"
              readOnly
              value={inviteUrl}
              onFocus={(e) => e.target.select()}
              className="font-mono text-xs"
            />
          </div>
          <ShareActions url={inviteUrl} text={shareText} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
