import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { requestSellerShare, type SessionPublic } from '@broker/extension-auth'
import { sendMessage } from '../auth/messaging'
import type { ExtensionResponse } from '../auth/types'

type View = 'loading' | 'login' | 'loggedIn'

function sessionFrom(response: ExtensionResponse): SessionPublic | null {
  if (response.ok && 'session' in response) return response.session
  return null
}

export function PopupApp() {
  const [view, setView] = useState<View>('loading')
  const [session, setSession] = useState<SessionPublic>({ status: 'loggedOut' })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [justLoggedIn, setJustLoggedIn] = useState(false)
  const handshakeTriedRef = useRef(false)

  const applySession = useCallback((next: SessionPublic) => {
    setSession(next)
    setView(next.status === 'loggedOut' ? 'login' : 'loggedIn')
  }, [])

  useEffect(() => {
    void (async () => {
      const response = await sendMessage({ type: 'GET_SESSION' })
      const next = sessionFrom(response)
      if (next && next.status !== 'loggedOut') {
        applySession(next)
        return
      }
      if (handshakeTriedRef.current) {
        setView('login')
        return
      }
      handshakeTriedRef.current = true
      const shared = await requestSellerShare()
      if (shared && shared.status !== 'loggedOut') {
        applySession(shared)
        return
      }
      setView('login')
    })()
  }, [applySession])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const response = await sendMessage({ type: 'LOGIN', email, password })
      if (!response.ok) {
        setError(response.error)
        return
      }
      const next = sessionFrom(response)
      if (!next) {
        setError('Respuesta inválida')
        return
      }
      setJustLoggedIn(true)
      setPassword('')
      applySession(next)
    } finally {
      setSubmitting(false)
    }
  }

  async function onLogout() {
    setError(null)
    setJustLoggedIn(false)
    const response = await sendMessage({ type: 'LOGOUT' })
    const next = sessionFrom(response)
    if (next) applySession(next)
  }

  if (view === 'loading') {
    return (
      <div className="popup">
        <p className="muted">Cargando…</p>
      </div>
    )
  }

  if (view === 'loggedIn' && session.status !== 'loggedOut') {
    return (
      <div className="popup">
        <header className="popup-header">
          <div className="brand-icon" aria-hidden>
            <FbIcon />
          </div>
          <div>
            <h1 className="title">Vendelo360</h1>
            <p className="subtitle">Sesión activa</p>
          </div>
        </header>

        {justLoggedIn ? (
          <p className="success">Sesión iniciada. Abre Facebook: el panel aparece a la derecha.</p>
        ) : null}

        <div className="card">
          <p className="user-name">{session.user.name}</p>
          <p className="user-email">{session.user.email}</p>
        </div>

        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={() => void onLogout()}>
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="popup">
      <header className="popup-header">
        <div className="brand-icon" aria-hidden>
          <FbIcon />
        </div>
        <div>
          <h1 className="title">Vendelo360</h1>
          <p className="subtitle">Acceso vendedores</p>
        </div>
      </header>

      <form className="form" onSubmit={(e) => void onSubmit(e)}>
        <label className="field">
          <span>Correo</span>
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
        </label>

        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  )
}

function FbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H6v4h3v7h4v-7h3.2L17 11h-4V9c0-.6.4-1 1-1z" />
    </svg>
  )
}
