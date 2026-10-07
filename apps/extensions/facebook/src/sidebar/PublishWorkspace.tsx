import { useCallback, useEffect, useState } from 'react'
import type { SessionPublic } from '@broker/extension-auth'
import type { AdsMessageSummary } from '../auth/types'
import { sendMessage } from '../auth/messaging'

type AuthenticatedSession = Exclude<SessionPublic, { status: 'loggedOut' }>

type Props = {
  session: AuthenticatedSession & { status: 'ready' }
  onSelectOrg: (organizationId: string) => Promise<void>
}

export function PublishWorkspace({ session, onSelectOrg }: Props) {
  const [adsMessages, setAdsMessages] = useState<AdsMessageSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [switchingOrg, setSwitchingOrg] = useState(false)

  const loadAds = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await sendMessage({ type: 'LIST_ADS_MESSAGES' })
      if (!response.ok) {
        setError(response.error)
        setAdsMessages([])
        return
      }
      if ('adsMessages' in response) {
        setAdsMessages(response.adsMessages)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAds()
  }, [loadAds, session.organizationId])

  async function handleOrgChange(organizationId: string) {
    if (organizationId === session.organizationId) return
    setSwitchingOrg(true)
    setError(null)
    try {
      await onSelectOrg(organizationId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar de organización')
    } finally {
      setSwitchingOrg(false)
    }
  }

  return (
    <>
      {session.organizations.length > 1 ? (
        <div className="org-switch">
          <label htmlFor="fb-org-select" className="muted">
            Organización
          </label>
          <select
            id="fb-org-select"
            className="org-select"
            value={session.organizationId ?? ''}
            disabled={switchingOrg || loading}
            onChange={(event) => void handleOrgChange(event.target.value)}
          >
            {session.organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="selected-row">
        <p className="section-title">Anuncios</p>
        <button
          type="button"
          className="btn-text"
          disabled={loading}
          onClick={() => void loadAds()}
        >
          {loading ? 'Cargando…' : 'Actualizar'}
        </button>
      </div>

      <p className="muted publish-hint">
        Mensajes preparados para publicar en Facebook.
      </p>

      {error ? <p className="error">{error}</p> : null}

      {loading && adsMessages.length === 0 ? (
        <div className="empty">Cargando anuncios…</div>
      ) : adsMessages.length === 0 ? (
        <div className="empty">
          No hay anuncios. Créalos en la web de vendedores.
        </div>
      ) : (
        <ul className="queue-list">
          {adsMessages.map((ad) => (
            <li key={ad.id} className="queue-item">
              <div className="queue-item-main">
                {ad.photo_url ? (
                  <img className="product-thumb" src={ad.photo_url} alt="" />
                ) : (
                  <div className="product-thumb" />
                )}
                <div className="queue-item-info">
                  <p className="product-name">{ad.title}</p>
                  <p className="product-code">{ad.code}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
