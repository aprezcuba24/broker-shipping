import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPriceCents(cents: number): string {
  return (cents / 100).toLocaleString('es', {
    style: 'currency',
    currency: 'USD',
  })
}

export function toPriceCents(price: number): number {
  return Math.round(price * 100)
}

/** Format a decimal amount with a currency code, e.g. `"12.50 CUP"`. */
export function formatMoney(amount: string | number, currency: string): string {
  return `${amount} ${currency.toUpperCase()}`
}
