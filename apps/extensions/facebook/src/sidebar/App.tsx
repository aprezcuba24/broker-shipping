import { useEffect, useState } from 'react'
import { SIDEBAR_OPEN_STORAGE_KEY } from '../constants'
import { syncSidebarChrome } from '../layout'
import { AuthGate, ConnectingGate, LoggedOutGate } from './AuthGate'
import { PublishWorkspace } from './PublishWorkspace'
import { useExtensionSession } from './useExtensionSession'
import AppIcon from '../icon'

function readTheme(): 'dark' | 'light' {
  const scheme = window.matchMedia('(prefers-color-scheme: dark)').matches
  return scheme ? 'dark' : 'light'
}

function readSidebarOpen(): boolean {
  try {
    const raw = localStorage.getItem(SIDEBAR_OPEN_STORAGE_KEY)
    if (raw === null) return true
    return raw === '1' || raw === 'true'
  } catch {
    return true
  }
}

function writeSidebarOpen(open: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_OPEN_STORAGE_KEY, open ? '1' : '0')
  } catch {
    // ignore
  }
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  )
}

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(readTheme)
  const [open, setOpen] = useState(readSidebarOpen)
  const { session, loading, openAuth, selectOrg, logout } = useExtensionSession()

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => setTheme(mq.matches ? 'dark' : 'light')
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    syncSidebarChrome(open)
    writeSidebarOpen(open)
  }, [open])

  if (!open) {
    return (
      <button
        type="button"
        className="fab-show"
        data-theme={theme}
        title="Mostrar panel Vendelo360"
        aria-label="Mostrar panel Vendelo360"
        onClick={() => setOpen(true)}
      >
        <AppIcon size={40} alt="Vendelo360" />
      </button>
    )
  }

  return (
    <div className="panel" data-theme={theme}>
      <header className="header">
        <div className="header-top">
          <div className="brand">
            <div className="brand-icon">
              <AppIcon size={35} alt="Vendelo360" />
            </div>
            <div>
              <h1 className="brand-title">Vendelo360</h1>
              <p className="brand-subtitle">Facebook</p>
            </div>
          </div>
          <div className="header-actions">
            {session.status !== 'loggedOut' ? (
              <button
                type="button"
                className="btn-logout"
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                onClick={() => void logout()}
              >
                <LogoutIcon />
              </button>
            ) : null}
            <button
              type="button"
              className="btn-hide"
              title="Ocultar panel"
              aria-label="Ocultar panel"
              onClick={() => setOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>
        </div>
        {session.status !== 'loggedOut' ? (
          <p className="header-org" title={session.user.email}>
            {session.status === 'ready'
              ? (session.organizations.find((o) => o.id === session.organizationId)?.name ??
                'Organización')
              : session.user.name}
          </p>
        ) : null}
      </header>

      <div className="body">
        {loading ? (
          <ConnectingGate />
        ) : session.status === 'loggedOut' ? (
          <LoggedOutGate onOpenAuth={() => void openAuth()} />
        ) : session.status === 'ready' ? (
          <PublishWorkspace
            session={{ ...session, status: 'ready' }}
            onSelectOrg={async (organizationId) => {
              const response = await selectOrg(organizationId)
              if (!response.ok) throw new Error(response.error)
            }}
          />
        ) : (
          <AuthGate
            session={session}
            onOpenAuth={() => void openAuth()}
            onSelectOrg={async (organizationId) => {
              const response = await selectOrg(organizationId)
              if (!response.ok) throw new Error(response.error)
            }}
          />
        )}
      </div>
    </div>
  )
}
