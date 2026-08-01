import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { z } from 'zod'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

/** Centavos → "12.50 CUP" for display. */
export function formatMoney(cents: number, currency: string): string {
  return `${centsToInputValue(cents)} ${currency.toUpperCase()}`
}

/** Zod schema for money stored as integer cents. */
export const moneyCentsSchema = z.number().int().min(0)
