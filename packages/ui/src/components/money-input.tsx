import {
  useEffect,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type FocusEvent,
} from 'react'

import { centsToInputValue, isValidMoneyInput, parseMoneyInput } from '../lib/utils'
import { Input } from './ui/input'

export type MoneyInputProps = Omit<
  ComponentProps<typeof Input>,
  'value' | 'defaultValue' | 'onChange' | 'type'
> & {
  /** Valor en centavos (del modelo/API). */
  value: number
  /** Emite centavos enteros al confirmar edición. */
  onValueChange: (cents: number) => void
}

export function MoneyInput({
  value,
  onValueChange,
  onBlur,
  ...inputProps
}: MoneyInputProps) {
  const [text, setText] = useState(() => centsToInputValue(value))

  useEffect(() => {
    setText(centsToInputValue(value))
  }, [value])

  const commit = () => {
    if (!isValidMoneyInput(text)) {
      setText(centsToInputValue(value))
      return
    }
    const cents = parseMoneyInput(text)
    setText(centsToInputValue(cents))
    if (cents !== value) {
      onValueChange(cents)
    }
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setText(event.target.value)
  }

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    commit()
    onBlur?.(event)
  }

  return (
    <Input
      {...inputProps}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}
