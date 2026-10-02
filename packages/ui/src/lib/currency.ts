import { Currency } from '@broker/api'

export const CURRENCY_OPTIONS: { id: Currency; name: string }[] = [
  { id: Currency.usd, name: 'USD' },
  { id: Currency.cup, name: 'CUP' },
]
