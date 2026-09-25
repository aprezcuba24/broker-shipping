export type PurchaseTierValue = 0 | 1 | 5 | 10

export type BlacklistStatus = 'no' | 'reported' | 'yes'

export type BlacklistReason = 'nonpayment' | 'fraud' | 'abuse' | 'other'

/** Map exact purchase count to the coarsest public tier (never show the raw number). */
export function purchaseTier(count: number): PurchaseTierValue {
  if (count <= 0) return 0
  if (count < 5) return 1
  if (count < 10) return 5
  return 10
}

/** Coerce API / unknown values into a valid public tier. */
export function asPurchaseTier(value: unknown): PurchaseTierValue {
  if (value === 1 || value === 5 || value === 10) return value
  return 0
}

export function asBlacklistStatus(value: unknown): BlacklistStatus {
  if (value === 'reported' || value === 'yes') return value
  return 'no'
}
