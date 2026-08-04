import { Badge } from '../components/ui/badge'

export type CommissionBadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive'

export const COMMISSION_PAID_FILTER_OPTIONS: { id: string; name: string }[] = [
  { id: 'false', name: 'Pendientes' },
  { id: 'true', name: 'Pagadas' },
]

export function commissionPaidLabel(isPaid: boolean): string {
  return isPaid ? 'Pagada' : 'Pendiente'
}

export function commissionPaidVariant(isPaid: boolean): CommissionBadgeVariant {
  return isPaid ? 'outline' : 'default'
}

export function CommissionPaidBadge({ isPaid }: { isPaid: boolean }) {
  return (
    <Badge variant={commissionPaidVariant(isPaid)}>{commissionPaidLabel(isPaid)}</Badge>
  )
}
