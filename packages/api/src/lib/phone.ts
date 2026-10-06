import { z } from 'zod'

export const PHONE_INVALID_MESSAGE =
  'Introduce un teléfono válido (8 dígitos, o con código de país)'

/** Strip everything that is not a digit. */
export function toPhoneDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Valid after digit-only input: 8 (local Cuban mobile) or 10–15 (with country code).
 * Matches backend normalization (8-digit → prefix 53).
 */
export function isValidPhoneDigits(digits: string): boolean {
  const len = digits.length
  return len === 8 || (len >= 10 && len <= 15)
}

/** Expects digit-only values (e.g. from PhoneInput). */
export const phoneSchema = z
  .string()
  .min(1, 'El teléfono es obligatorio')
  .max(15, PHONE_INVALID_MESSAGE)
  .refine(isValidPhoneDigits, PHONE_INVALID_MESSAGE)

/** Optional phone: empty string allowed; otherwise same rules as phoneSchema. */
export const optionalPhoneSchema = z
  .string()
  .max(15, PHONE_INVALID_MESSAGE)
  .refine((value) => value === '' || isValidPhoneDigits(value), PHONE_INVALID_MESSAGE)
