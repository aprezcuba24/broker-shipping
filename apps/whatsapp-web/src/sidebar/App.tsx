import { useEffect, useState } from 'react'
import type { DetectedChat } from '../detect-chat'
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

export function App({ chat }: Props) {
  const [theme, setTheme] = useState<'dark' | 'light'>(readTheme)

  useEffect(() => {
    const sync = () => setTheme(readTheme())
    const observer = new MutationObserver(sync)
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  const hasChat = Boolean(chat.name || chat.phone)
  const suggestOpenContactInfo =
    Boolean(chat.name) &&
    !chat.phone &&
    !chat.isGroup &&
    chat.phoneStatus === 'unknown'
  const customer = hasChat
    ? buildMockCustomer(chat.name ?? 'No disponible', phoneLabel(chat))
    : null

  return (
    <div className="panel" data-theme={theme}>
      <header className="header">
        <h1>Información</h1>
        <p>Broker · WhatsApp Web POC</p>
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
