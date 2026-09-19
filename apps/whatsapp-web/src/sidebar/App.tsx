import { useEffect, useState } from 'react'
import { SIDEBAR_OPEN_STORAGE_KEY } from '../constants'
import type { DetectedChat } from '../detect-chat'
import { syncSidebarChrome } from '../layout'
import { buildMockCustomer } from '../mock-customer'
import { CustomerCard } from './CustomerCard'

type Props = {
  chat: DetectedChat
}

function readTheme(): 'dark' | 'light' {
  return document.body.classList.contains('dark') ? 'dark' : 'light'
}

function phoneLabel(chat: DetectedChat): string {
  if (chat.phone) return chat.phone
  if (chat.phoneStatus === 'unavailable') return 'No se pudo obtener'
  return 'No disponible'
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
    // ignore quota / private mode
  }
}

export function App({ chat }: Props) {
  const [theme, setTheme] = useState<'dark' | 'light'>(readTheme)
  const [open, setOpen] = useState(readSidebarOpen)

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

  const hasChat = Boolean(chat.name || chat.phone)
  const suggestOpenContactInfo =
    Boolean(chat.name) &&
    !chat.phone &&
    !chat.isGroup &&
    chat.phoneStatus === 'unknown'
  const customer = hasChat
    ? buildMockCustomer(chat.name ?? 'No disponible', phoneLabel(chat))
    : null

  if (!open) {
    return (
      <button
        type="button"
        className="fab-show"
        data-theme={theme}
        title="Mostrar panel Broker"
        aria-label="Mostrar panel Broker"
        onClick={() => setOpen(true)}
      >
        B
      </button>
    )
  }

  return (
    <div className="panel" data-theme={theme}>
      <header className="header">
        <div className="header-top">
          <div className="header-text">
            <h1>Información</h1>
            <p>Broker · WhatsApp Web POC</p>
          </div>
          <button
            type="button"
            className="btn-hide"
            title="Ocultar panel"
            aria-label="Ocultar panel"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>
      </header>
      <div className="body">
        {customer ? (
          <CustomerCard
            customer={customer}
            suggestOpenContactInfo={suggestOpenContactInfo}
          />
        ) : (
          <div className="empty">
            Ninguna conversación abierta.
            <br />
            Abre un chat para ver el contacto detectado.
          </div>
        )}
      </div>
    </div>
  )
}
