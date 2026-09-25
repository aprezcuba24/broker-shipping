import { useEffect, useState } from 'react'
import { SIDEBAR_OPEN_STORAGE_KEY } from '../constants'
import type { DetectedChat } from '../detect-chat'
import { syncSidebarChrome } from '../layout'
import { buildCustomer } from '../customer'
import { AuthGate, LoggedOutGate } from './AuthGate'
import { CustomerCard } from './CustomerCard'
import { useCustomerLookup } from './useCustomerLookup'
import { useExtensionSession } from './useExtensionSession'

type Props = {
  chat: DetectedChat
}

function readTheme(): 'dark' | 'light' {
  return document.body.classList.contains('dark') ? 'dark' : 'light'
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

function ChatIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
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

export function App({ chat }: Props) {
  const [theme, setTheme] = useState<'dark' | 'light'>(readTheme)
  const [open, setOpen] = useState(readSidebarOpen)
  const { session, loading, openAuth, selectOrg, logout } = useExtensionSession()

  useEffect(() => {
    const sync = () => setTheme(readTheme())
    const observer = new MutationObserver(sync)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    syncSidebarChrome(open)
    writeSidebarOpen(open)
  }, [open])

  const hasChat = Boolean(chat.name || chat.phone || chat.kind !== 'unknown')
  const suggestOpenContactInfo =
    Boolean(chat.name) &&
    !chat.phone &&
    !chat.isGroup &&
    chat.phoneStatus === 'unknown'
  const customer = hasChat ? buildCustomer(chat) : null
  const isReady = session.status === 'ready'
  const lookup = useCustomerLookup(
    chat.phone,
    isReady && Boolean(chat.phone) && !chat.isGroup,
  )

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
        <ChatIcon size={20} />
      </button>
    )
  }

  return (
    <div className="panel" data-theme={theme}>
      <header className="header">
        <div className="header-top">
          <div className="brand">
            <div className="brand-icon">
              <ChatIcon />
            </div>
            <div className="brand-text">
              <h1 className="brand-title">Vendelo360</h1>
              <p className="brand-subtitle">WhatsApp</p>
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
          isReady && session.status === 'ready' ? (
            <p className="header-org" title={session.user.email}>
              {session.organizations.find((o) => o.id === session.organizationId)?.name ??
                'Organización'}
            </p>
          ) : (
            <p className="header-org" title={session.user.email}>
              {session.user.name}
            </p>
          )
        ) : null}
      </header>
      <div className="body">
        {loading ? (
          <div className="empty">Cargando sesión…</div>
        ) : session.status === 'loggedOut' ? (
          <LoggedOutGate onOpenAuth={() => void openAuth()} />
        ) : session.status === 'ready' ? (
          customer ? (
            <CustomerCard
              customer={customer}
              suggestOpenContactInfo={suggestOpenContactInfo}
              lookup={lookup}
            />
          ) : (
            <div className="empty">
              Ninguna conversación abierta.
              <br />
              Abre un chat para ver el contacto.
            </div>
          )
        ) : (
          <AuthGate
            session={session}
            onOpenAuth={() => void openAuth()}
            onSelectOrg={async (organizationId) => {
              const response = await selectOrg(organizationId)
              if (!response.ok) {
                throw new Error(response.error)
              }
            }}
          />
        )}
      </div>
    </div>
  )
}
