import type { PhoneBlacklistReason } from '@broker/api'

export const PHONE_BLACKLIST_REASON_LABELS: Record<PhoneBlacklistReason, string> = {
  nonpayment: 'Impago',
  fraud: 'Fraude',
  abuse: 'Abuso',
  other: 'Otro',
}

export function phoneBlacklistReasonLabel(reason: PhoneBlacklistReason): string {
  return PHONE_BLACKLIST_REASON_LABELS[reason] ?? reason
}

export function communityEvaluationLabel(otherCount: number): string {
  if (otherCount <= 0) return 'Solo tú'
  if (otherCount === 1) return 'También 1 organización'
  return `También ${otherCount} organizaciones`
}
