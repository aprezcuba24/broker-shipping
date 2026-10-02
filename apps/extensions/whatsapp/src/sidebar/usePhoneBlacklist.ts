import { useEffect, useState } from 'react'
import {
  addToBlacklist,
  getBlacklistStatus,
  removeFromBlacklist,
} from '../auth/messaging'
import { normalizePhone } from '../phone'
import {
  asBlacklistStatus,
  type BlacklistReason,
  type BlacklistStatus,
} from '../purchase-tier'

export type PhoneBlacklistState = {
  status: BlacklistStatus
  otherCount: number
  busy: boolean
  error: string | null
  add: (input: { reason: BlacklistReason; note?: string }) => Promise<void>
  remove: () => Promise<void>
}

const IDLE: PhoneBlacklistState = {
  status: 'no',
  otherCount: 0,
  busy: false,
  error: null,
  add: async () => undefined,
  remove: async () => undefined,
}

export function usePhoneBlacklist(
  phone: string | null | undefined,
  enabled: boolean,
): PhoneBlacklistState {
  const phoneDigits = phone ? normalizePhone(phone) : null
  const [status, setStatus] = useState<BlacklistStatus>('no')
  const [otherCount, setOtherCount] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !phoneDigits) {
      setStatus('no')
      setOtherCount(0)
      setError(null)
      return
    }

    let cancelled = false
    setBusy(true)
    setError(null)

    void (async () => {
      const response = await getBlacklistStatus(phoneDigits)
      if (cancelled) return
      if (!response.ok) {
        setError(response.error)
        setStatus('no')
        setOtherCount(0)
        setBusy(false)
        return
      }
      setStatus(asBlacklistStatus(response.blacklist.status))
      setOtherCount(response.blacklist.other_count)
      setBusy(false)
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, phoneDigits])

  if (!enabled || !phoneDigits) return IDLE

  return {
    status,
    otherCount,
    busy,
    error,
    add: async ({ reason, note }) => {
      setBusy(true)
      setError(null)
      const response = await addToBlacklist({ phone: phoneDigits, reason, note })
      if (!response.ok) {
        setError(response.error)
        setBusy(false)
        throw new Error(response.error)
      }
      setStatus(asBlacklistStatus(response.blacklist.status))
      setOtherCount(response.blacklist.other_count)
      setBusy(false)
    },
    remove: async () => {
      setBusy(true)
      setError(null)
      const response = await removeFromBlacklist(phoneDigits)
      if (!response.ok) {
        setError(response.error)
        setBusy(false)
        throw new Error(response.error)
      }
      setStatus(asBlacklistStatus(response.blacklist.status))
      setOtherCount(response.blacklist.other_count)
      setBusy(false)
    },
  }
}
