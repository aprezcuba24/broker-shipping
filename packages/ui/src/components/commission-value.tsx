import type { Money } from '@broker/api'

import { cn, formatMoney } from '../lib/utils'

export type CommissionValueProps = {
  hasCommission: boolean
  commission: Money
  className?: string
}

export function CommissionValue({
  hasCommission,
  commission,
  className,
}: CommissionValueProps) {
  if (hasCommission === false) {
    return <span className={className}>Libre</span>
  }

  return (
    <span className={cn('tabular-nums text-sm', className)}>
      {formatMoney(commission)}
    </span>
  )
}
