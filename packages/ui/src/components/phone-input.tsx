import type { ChangeEvent, ComponentProps } from 'react'

import { toPhoneDigits } from '@broker/api'

import { Input } from './ui/input'

export type PhoneInputProps = Omit<
  ComponentProps<typeof Input>,
  'type' | 'inputMode' | 'onChange' | 'value'
> & {
  value?: string
  onChange?: (value: string) => void
}

/**
 * Text input that only accepts digits (letters, @, spaces, and signs are stripped).
 */
export function PhoneInput({
  value,
  onChange,
  maxLength = 15,
  ...props
}: PhoneInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(toPhoneDigits(event.target.value))
  }

  return (
    <Input
      {...props}
      type="tel"
      inputMode="numeric"
      autoComplete={props.autoComplete ?? 'tel'}
      maxLength={maxLength}
      value={value === undefined ? undefined : toPhoneDigits(value)}
      onChange={handleChange}
    />
  )
}
