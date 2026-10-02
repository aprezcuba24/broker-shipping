/** Heuristic: value looks like a phone number. */
export function looksLikePhone(value: string): boolean {
  return normalizePhone(value) != null
}

/** Digits only (no +). */
export function normalizePhone(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const cleaned = trimmed.replace(/[\s\-().]/g, '')
  if (!/^\+?\d{7,15}$/.test(cleaned)) return null
  return cleaned.replace(/^\+/, '')
}

export function formatPhone(digits: string): string {
  return digits.startsWith('+') ? digits : `+${digits}`
}
