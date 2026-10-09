import { useCallback, useEffect, useRef, useState } from 'react'
import {
  requestSellerShare,
  SESSION_STORAGE_KEY,
  type ExtensionSession,
  type SessionPublic,
  type SessionResponse,
} from '@broker/extension-auth'
import { sendMessage } from '../auth/messaging'

function toPublic(session: ExtensionSession | null | undefined): SessionPublic {
  if (!session || session.status === 'loggedOut') {
    return { status: 'loggedOut' }
  }
  return {
    status: session.status,
    user: session.user,
    organizations: session.organizations,
    organizationId: session.organizationId,
  }
}

function asSessionPublic(response: SessionResponse | null): SessionPublic | null {
  if (!response) return null
  if (!response.ok || !('session' in response)) return null
  return response.session
}

function asSessionResponse(response: unknown): SessionResponse | null {
  if (!response || typeof response !== 'object') return null
  const r = response as SessionResponse
  if (!r.ok) return r
  if (!('session' in r)) return null
  return r
}

export function useExtensionSession() {
  const [session, setSession] = useState<SessionPublic>({ status: 'loggedOut' })
  const [loading, setLoading] = useState(true)
  const handshakeTriedRef = useRef(false)

  const refresh = useCallback(async () => {
    const response = asSessionResponse(await sendMessage({ type: 'GET_SESSION' }))
    if (response?.ok) {
      setSession(response.session)
    } else {
      setSession({ status: 'loggedOut' })
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const initialResponse = asSessionResponse(await sendMessage({ type: 'GET_SESSION' }))
      const initial = asSessionPublic(initialResponse)
      if (initial && initial.status !== 'loggedOut') {
        if (!cancelled) {
          setSession(initial)
          setLoading(false)
        }
        return
      }

      let next: SessionPublic | null = null
      if (!handshakeTriedRef.current) {
        handshakeTriedRef.current = true
        next = await requestSellerShare()
      }
      if (cancelled) return
      if (next && next.status !== 'loggedOut') {
        setSession(next)
      } else {
        setSession({ status: 'loggedOut' })
      }
      setLoading(false)
    })()

    const onChanged: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (
      changes,
      area,
    ) => {
      if (area !== 'local' || !changes[SESSION_STORAGE_KEY]) return
      setSession(toPublic(changes[SESSION_STORAGE_KEY].newValue as ExtensionSession))
    }

    chrome.storage.onChanged.addListener(onChanged)
    return () => {
      cancelled = true
      chrome.storage.onChanged.removeListener(onChanged)
    }
  }, [])

  const openAuth = useCallback(async () => {
    await sendMessage({ type: 'OPEN_AUTH' })
  }, [])

  const selectOrg = useCallback(async (organizationId: string) => {
    const response = asSessionResponse(await sendMessage({ type: 'SELECT_ORG', organizationId }))
    if (response?.ok) {
      setSession(response.session)
      return response
    }
    return response ?? { ok: false as const, error: 'Respuesta inválida' }
  }, [])

  const logout = useCallback(async () => {
    const response = asSessionResponse(await sendMessage({ type: 'LOGOUT' }))
    if (response?.ok) {
      setSession(response.session)
      return response
    }
    return response ?? { ok: false as const, error: 'Respuesta inválida' }
  }, [])

  return { session, loading, openAuth, selectOrg, logout, refresh }
}
