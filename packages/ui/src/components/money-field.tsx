import type { Currency, Money } from '@broker/api'

import { CURRENCY_OPTIONS } from '../lib/currency'
import { cn } from '../lib/utils'
import { EntitySelect } from './entity-select'
import { MoneyInput } from './money-input'

export type MoneyFieldProps = {
  id?: string
  value: Money
  onValueChange: (value: Money) => void
  disabled?: boolean
  'aria-invalid'?: boolean
  className?: string
}

export function MoneyField({
  id,
  value,
  onValueChange,
  disabled,
  'aria-invalid': ariaInvalid,
  className,
}: MoneyFieldProps) {
  const amountId = id
  const currencyId = id ? `${id}-currency` : undefined

  return (
    <div className={cn('flex gap-2', className)}>
      <MoneyInput
        id={amountId}
        value={value.amount}
        onValueChange={(amount) => onValueChange({ ...value, amount })}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        className="min-w-0 flex-1"
      />
      <EntitySelect
        id={currencyId}
        items={CURRENCY_OPTIONS}
        value={value.currency}
        onValueChange={(currency) =>
          onValueChange({ ...value, currency: currency as Currency })
        }
        placeholder="Moneda"
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-label="Moneda"
        triggerClassName="w-[7.5rem] shrink-0"
      />
    </div>
  )
}
