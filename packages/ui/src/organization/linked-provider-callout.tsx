import { Building2 } from 'lucide-react'

import { cn } from '../lib/utils'

export type LinkedProviderCalloutProps = {
  providerName: string
  /** Defaults to seller-link copy. Use member-invite label when joining as a member. */
  label?: string
  className?: string
}

/** Highlights an organization the user will link to or join as a member. */
export function LinkedProviderCallout({
  providerName,
  label = 'Te vas a vincular con',
  className,
}: LinkedProviderCalloutProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-border/70 bg-surface-container-low px-4 py-3',
        className,
      )}
      role="status"
    >
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-lowest text-on-surface-variant">
        <Building2 className="size-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate font-headline text-lg font-semibold leading-snug text-on-surface">
          {providerName}
        </p>
      </div>
    </div>
  )
}

export const MEMBER_INVITE_CALLOUT_LABEL = 'Te unirás como miembro a'
