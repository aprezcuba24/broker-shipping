import { useEffect, useState } from 'react'
import { lookupCustomer } from '../auth/messaging'
import { normalizePhone } from '../phone'
import {
  EMPTY_CUSTOMER_LOOKUP,
  type CustomerLookup,
} from '../services/types'

export type CustomerLookupState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; lookup: CustomerLookup }
  | { status: 'error'; error: string }

/**
 * Asks the background SW to look up CRM customer + last order by phone.
 * Only runs when `enabled` and the phone normalizes to digits.
 */
export function useCustomerLookup(
  phone: string | null | undefined,
  enabled: boolean,
): CustomerLookupState {
  const [state, setState] = useState<CustomerLookupState>({ status: 'idle' })
  const phoneDigits = phone ? normalizePhone(phone) : null

  useEffect(() => {
    if (!enabled || !phoneDigits) {
      setState({ status: 'idle' })
      return
    }

    let cancelled = false
    setState({ status: 'loading' })

    void (async () => {
      const response = await lookupCustomer(phoneDigits)
      if (cancelled) return
      if (!response.ok) {
        setState({ status: 'error', error: response.error })
        return
      }
      setState({
        status: 'ready',
        lookup: response.lookup ?? EMPTY_CUSTOMER_LOOKUP,
      })
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, phoneDigits])

  return state
}
