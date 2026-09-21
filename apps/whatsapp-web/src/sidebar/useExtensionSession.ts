import { useCallback, useEffect, useState } from 'react'
import { SESSION_STORAGE_KEY } from '../auth/constants'
import { sendMessage } from '../auth/messaging'
import type {
  ExtensionSession,
  SessionPublic,
  SessionResponse,
} from '../auth/types'

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
      await refresh()
      if (!cancelled) setLoading(false)
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
  }, [refresh])

  const openAuth = useCallback(async () => {
    await sendMessage({ type: 'OPEN_AUTH' })
  }, [])

  const selectOrg = useCallback(async (organizationId: string) => {
    const response = asSessionResponse(
      await sendMessage({ type: 'SELECT_ORG', organizationId }),
    )
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
