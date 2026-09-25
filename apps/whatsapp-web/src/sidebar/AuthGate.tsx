import { useState } from 'react'
import { SELLER_APP_URL } from '../auth/constants'
import type { SellerOrganization, SessionPublic } from '../auth/types'

type Props = {
  session: Exclude<SessionPublic, { status: 'loggedOut' }>
  onSelectOrg: (organizationId: string) => Promise<void>
  onOpenAuth: () => void
}

export function AuthGate({ session, onSelectOrg, onOpenAuth }: Props) {
  if (session.status === 'noSellerOrg') {
    return (
      <div className="gate">
        <h2 className="gate-title">Sin organización vendedora</h2>
        <p className="gate-text">
          Tu cuenta no pertenece a ninguna organización de tipo vendedor. Crea o
          únete a una desde la web de vendedores.
        </p>
        <a
          className="btn-gate"
          href={SELLER_APP_URL}
          target="_blank"
          rel="noreferrer"
        >
          Abrir web de vendedores
        </a>
        <button type="button" className="btn-gate-secondary" onClick={onOpenAuth}>
          Gestionar sesión
        </button>
      </div>
    )
  }

  if (session.status === 'needsOrgSelection') {
    return (
      <OrgPicker
        organizations={session.organizations}
        onSelectOrg={onSelectOrg}
      />
    )
  }

  return null
}

function OrgPicker({
  organizations,
  onSelectOrg,
}: {
  organizations: SellerOrganization[]
  onSelectOrg: (organizationId: string) => Promise<void>
}) {
  const [selected, setSelected] = useState(organizations[0]?.id ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    if (!selected) return
    setSubmitting(true)
    setError(null)
    try {
      await onSelectOrg(selected)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo seleccionar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="gate">
      <h2 className="gate-title">Elige tu organización</h2>
      <p className="gate-text">
        Tienes más de una organización vendedora. Selecciona con cuál trabajar en
        WhatsApp.
      </p>
      <ul className="org-list" role="radiogroup" aria-label="Organizaciones">
        {organizations.map((org) => (
          <li key={org.id}>
            <label className={`org-option${selected === org.id ? ' is-selected' : ''}`}>
              <input
                type="radio"
                name="seller-org"
                value={org.id}
                checked={selected === org.id}
                onChange={() => setSelected(org.id)}
              />
              <span>{org.name}</span>
            </label>
          </li>
        ))}
      </ul>
      {error ? <p className="gate-error">{error}</p> : null}
      <button
        type="button"
        className="btn-gate"
        disabled={!selected || submitting}
        onClick={() => void confirm()}
      >
        {submitting ? 'Guardando…' : 'Continuar'}
      </button>
    </div>
  )
}

export function LoggedOutGate({ onOpenAuth }: { onOpenAuth: () => void }) {
  return (
    <div className="gate">
      <h2 className="gate-title">Inicia sesión</h2>
      <p className="gate-text">
        Accede con tu cuenta de vendedor para ver la ficha del cliente en WhatsApp.
      </p>
      <button type="button" className="btn-gate" onClick={onOpenAuth}>
        Iniciar sesión
      </button>
    </div>
  )
}
