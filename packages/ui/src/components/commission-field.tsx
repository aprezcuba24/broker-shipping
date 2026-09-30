import type { Money } from '@broker/api'

import { Field, FieldLabel } from './ui/field'
import { Switch } from './ui/switch'
import { MoneyField } from './money-field'
import { cn } from '../lib/utils'

export type CommissionFieldProps = {
  id?: string
  hasCommission: boolean
  onHasCommissionChange: (hasCommission: boolean) => void
  commission: Money
  onCommissionChange: (commission: Money) => void
  disabled?: boolean
  'aria-invalid'?: boolean
  className?: string
}

export function CommissionField({
  id = 'product-commission',
  hasCommission,
  onHasCommissionChange,
  commission,
  onCommissionChange,
  disabled,
  'aria-invalid': ariaInvalid,
  className,
}: CommissionFieldProps) {
  const switchId = `${id}-enabled`
  const moneyId = id

  return (
    <Field data-invalid={ariaInvalid} className={cn(className)}>
      <FieldLabel htmlFor={moneyId}>Comisión</FieldLabel>
      <div className="flex items-center gap-3">
        <Switch
          id={switchId}
          checked={hasCommission}
          onCheckedChange={onHasCommissionChange}
          disabled={disabled}
          aria-label="Tiene comisión"
        />
        <MoneyField
          id={moneyId}
          value={commission}
          onValueChange={onCommissionChange}
          disabled={disabled || !hasCommission}
          aria-invalid={ariaInvalid}
          className="min-w-0 flex-1"
        />
      </div>
    </Field>
  )
}
