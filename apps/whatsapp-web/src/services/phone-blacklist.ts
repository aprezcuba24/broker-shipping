import { normalizePhone } from '../phone'
import { apiRequest } from './http'

export type BlacklistStatus = 'no' | 'reported' | 'yes'

export type BlacklistReason = 'nonpayment' | 'fraud' | 'abuse' | 'other'

export type PhoneBlacklistStatus = {
  phone: string
  status: BlacklistStatus
  own_entry_id: string | null
  other_count: number
}

export type PhoneBlacklistEntry = {
  id: string
  phone: string
  organization_id: string
  reason: BlacklistReason
  note: string | null
  withdrawn_at: string | null
}

export async function fetchPhoneBlacklistStatus(params: {
  phone: string
  accessToken: string
  organizationId: string
}): Promise<PhoneBlacklistStatus> {
  const phoneDigits = normalizePhone(params.phone)
  if (!phoneDigits) {
    return {
      phone: '',
      status: 'no',
      own_entry_id: null,
      other_count: 0,
    }
  }

  return apiRequest<PhoneBlacklistStatus>('/phone-blacklist/status', {
    token: params.accessToken,
    params: {
      organization_id: params.organizationId,
      phone: phoneDigits,
    },
  })
}

export async function addPhoneToBlacklist(params: {
  phone: string
  reason: BlacklistReason
  note?: string
  accessToken: string
  organizationId: string
}): Promise<PhoneBlacklistEntry> {
  const phoneDigits = normalizePhone(params.phone)
  if (!phoneDigits) {
    throw new Error('Teléfono inválido')
  }

  return apiRequest<PhoneBlacklistEntry>('/phone-blacklist/', {
    method: 'POST',
    token: params.accessToken,
    params: { organization_id: params.organizationId },
    body: {
      phone: phoneDigits,
      reason: params.reason,
      note: params.note,
    },
  })
}

export async function removePhoneFromBlacklist(params: {
  phone: string
  accessToken: string
  organizationId: string
}): Promise<void> {
  const phoneDigits = normalizePhone(params.phone)
  if (!phoneDigits) {
    throw new Error('Teléfono inválido')
  }

  await apiRequest<void>('/phone-blacklist/', {
    method: 'DELETE',
    token: params.accessToken,
    params: {
      organization_id: params.organizationId,
      phone: phoneDigits,
    },
  })
}
