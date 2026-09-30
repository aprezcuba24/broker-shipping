import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { z } from 'zod'
import { Currency, type Money } from '@broker/api'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}

const MONEY_INPUT_PATTERN = /^\d+(\.\d{1,2})?$/

/** Centavos → "12.50" for form inputs. */
export function centsToInputValue(cents: number): string {
  return (cents / 100).toFixed(2)
}

/** "12.50" → 1250. Throws if the string is not a valid money input. */
export function parseMoneyInput(value: string): number {
  const trimmed = value.trim()
  if (!MONEY_INPUT_PATTERN.test(trimmed)) {
    throw new Error('Invalid money input')
  }
  return Math.round(Number(trimmed) * 100)
}

/** Whether a string is a valid money input (non-negative, up to 2 decimals). */
export function isValidMoneyInput(value: string): boolean {
  const trimmed = value.trim()
  return MONEY_INPUT_PATTERN.test(trimmed) && Number(trimmed) >= 0
}

/** Centavos + currency → "12.50 CUP" for display. */
export function formatMoney(money: Money): string
export function formatMoney(cents: number, currency: string): string
export function formatMoney(moneyOrCents: Money | number, currency?: string): string {
  if (typeof moneyOrCents === 'object' && moneyOrCents !== null) {
    return `${centsToInputValue(moneyOrCents.amount)} ${moneyOrCents.currency.toUpperCase()}`
  }
  return `${centsToInputValue(moneyOrCents)} ${(currency ?? '').toUpperCase()}`
}

type SellerCommissionItem = {
  seller_commission: Money
  seller_commissions?: Money[] | null
}

/** Unit commission parts: multi-currency list, or the legacy single amount. */
export function sellerCommissionParts(item: SellerCommissionItem): Money[] {
  const parts = item.seller_commissions ?? []
  if (parts.length > 0) return parts
  return [item.seller_commission]
}

/** Order-item commission parts → "1.50 USD + 3.00 CUP", or the legacy single amount. */
export function formatSellerCommissions(item: SellerCommissionItem): string {
  return sellerCommissionParts(item)
    .map((money) => formatMoney(money))
    .join(' + ')
}

/** Line commissions × quantity, grouped by currency. Skips canceled items and zero amounts. */
export function sumSellerCommissions(
  items: Array<
    SellerCommissionItem & {
      quantity: number
      status: string
    }
  >,
): Money[] {
  const byCurrency = new Map<Money['currency'], number>()

  for (const item of items) {
    if (item.status === 'canceled') continue
    for (const part of sellerCommissionParts(item)) {
      if (part.amount <= 0) continue
      const line = part.amount * item.quantity
      byCurrency.set(part.currency, (byCurrency.get(part.currency) ?? 0) + line)
    }
  }

  return [...byCurrency.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, amount]) => ({ amount, currency }))
}

/** Zod schema for money stored as integer cents. */
export const moneyCentsSchema = z.number().int().min(0)

/** Zod schema for API Money: `{ amount, currency }`. */
export const moneySchema = z.object({
  amount: moneyCentsSchema,
  currency: z.enum([Currency.cup, Currency.usd]),
})

export type MoneyValue = z.infer<typeof moneySchema>

/** Default Money value (0 cents in the given currency). */
export function moneyDefault(currency: Currency = Currency.cup): MoneyValue {
  return { amount: 0, currency }
}
