import type { ReactNode } from 'react'
import type { ChatKind } from '../detect-chat'
import type { CustomerProfile } from '../customer'
import type { CustomerLookup } from '../services/types'
import type { CustomerLookupState } from './useCustomerLookup'

const ORDER_STATUS_LABEL: Record<string, string> = {
  created: 'Creada',
  processing: 'En proceso',
  finished: 'Finalizada',
  canceled: 'Cancelada',
}

type Props = {
  customer: CustomerProfile
  suggestOpenContactInfo?: boolean
  lookup?: CustomerLookupState
}

function formatOrderDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABEL[status] ?? status
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12h12" />
      <path d="M6 16h12" />
      <path d="M10 6h4" />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  )
}

function BookUserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
      <circle cx="12" cy="8" r="2" />
      <path d="M15 13a3 3 0 1 0-6 0" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function CheckBadgeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function kindIcon(kind: ChatKind) {
  if (kind === 'group') return <UsersIcon />
  if (kind === 'business') return <BuildingIcon />
  if (kind === 'contact') return <UserIcon />
  return <HelpIcon />
}

function accountSummary(
  customer: CustomerProfile,
  lookup: CustomerLookupState | undefined,
): {
  lastOrder: CustomerLookup['lastOrder']
  lastOrderPlaceholder: string | null
  address: string | null
  hint: string | null
} {
  if (!lookup || lookup.status === 'idle') {
    return {
      lastOrder: null,
      lastOrderPlaceholder: '—',
      address: customer.address,
      hint: null,
    }
  }
  if (lookup.status === 'loading') {
    return {
      lastOrder: null,
      lastOrderPlaceholder: '…',
      address: null,
      hint: null,
    }
  }
  if (lookup.status === 'error') {
    return {
      lastOrder: null,
      lastOrderPlaceholder: '—',
      address: null,
      hint: lookup.error,
    }
  }

  const { lookup: data } = lookup
  if (!data.customer) {
    return {
      lastOrder: null,
      lastOrderPlaceholder: '—',
      address: null,
      hint: null,
    }
  }

  return {
    lastOrder: data.lastOrder,
    lastOrderPlaceholder: data.lastOrder ? null : '—',
    address: data.address,
    hint: null,
  }
}

export function CustomerCard({
  customer,
  suggestOpenContactInfo = false,
  lookup,
}: Props) {
  const account = accountSummary(customer, lookup)

  const extras: { icon: ReactNode | null; label: string; value: string }[] = []
  if (account.address) {
    extras.push({
      icon: <MapPinIcon />,
      label: 'Dirección',
      value: account.address,
    })
  }
  if (customer.presence) {
    extras.push({ icon: null, label: 'Presencia', value: customer.presence })
  }
  if (customer.email) {
    extras.push({ icon: <MailIcon />, label: 'Email', value: customer.email })
  }
  if (customer.website) {
    extras.push({ icon: <GlobeIcon />, label: 'Sitio web', value: customer.website })
  }
  if (customer.participantCount != null) {
    extras.push({
      icon: <UsersIcon />,
      label: 'Participantes',
      value: String(customer.participantCount),
    })
  }

  return (
    <>
      <section className="section section-compact">
        <div className="contact-meta" role="group" aria-label="Contacto">
          <span className="meta-item meta-phone" title="Teléfono">
            <span className="meta-icon" aria-hidden>
              <PhoneIcon />
            </span>
            <span className="meta-text">{customer.phone}</span>
          </span>

          <span
            className="meta-item meta-icon-only"
            title={customer.kindLabel}
            aria-label={customer.kindLabel}
          >
            <span className="meta-icon">{kindIcon(customer.kind)}</span>
          </span>

          {customer.isSavedContact === true ? (
            <span
              className="meta-item meta-icon-only meta-saved"
              title="En agenda"
              aria-label="En agenda"
            >
              <span className="meta-icon">
                <BookUserIcon />
              </span>
            </span>
          ) : null}

          {customer.isVerified ? (
            <span
              className="meta-item meta-icon-only"
              title="Cuenta verificada"
              aria-label="Cuenta verificada"
            >
              <span className="meta-icon">
                <CheckBadgeIcon />
              </span>
            </span>
          ) : null}
        </div>

        {extras.length > 0 ? (
          <ul className="contact-extras">
            {extras.map((item) => (
              <li key={item.label} className="extra-item" title={item.label}>
                {item.icon ? (
                  <span className="meta-icon" aria-hidden>
                    {item.icon}
                  </span>
                ) : null}
                <span className="extra-text">{item.value}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {suggestOpenContactInfo ? (
          <p className="hint">
            Para obtener el teléfono, haz clic en el nombre del contacto en
            WhatsApp y abre <strong>Datos del contacto</strong>. El número se
            rellenará aquí automáticamente.
          </p>
        ) : null}
      </section>

      <section className="section">
        <header className="section-header">
          <span className="section-bar" aria-hidden />
          <h3 className="section-title">Último pedido</h3>
        </header>
        {account.lastOrder ? (
          <div className="order-summary">
            <p className="order-code">{account.lastOrder.code}</p>
            <p className="order-meta">
              {orderStatusLabel(account.lastOrder.status)}
              {' · '}
              {formatOrderDate(account.lastOrder.createdAt)}
            </p>
          </div>
        ) : (
          <p className="order-empty">{account.lastOrderPlaceholder}</p>
        )}
        {account.hint ? (
          <p className="hint" role="alert">
            {account.hint}
          </p>
        ) : null}
      </section>
    </>
  )
}
