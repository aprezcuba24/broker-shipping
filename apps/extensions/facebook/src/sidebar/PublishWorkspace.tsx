import { useCallback, useEffect, useState } from 'react'
import type { SessionPublic } from '@broker/extension-auth'
import type { AdsMessageSummary } from '../auth/types'
import { sendMessage } from '../auth/messaging'
import { PUBLISH_QUEUE_STORAGE_KEY } from '../constants'
import { parsePublishQueue, readPublishQueue } from '../publish-queue'

type AuthenticatedSession = Exclude<SessionPublic, { status: 'loggedOut' }>

type Props = {
  session: AuthenticatedSession & { status: 'ready' }
  onSelectOrg: (organizationId: string) => Promise<void>
}

export function PublishWorkspace({ session, onSelectOrg }: Props) {
  const [adsMessages, setAdsMessages] = useState<AdsMessageSummary[]>([])
  const [fromQueue, setFromQueue] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [switchingOrg, setSwitchingOrg] = useState(false)
  const [fillingId, setFillingId] = useState<string | null>(null)
  const [readyIds, setReadyIds] = useState<string[]>([])

  const loadAds = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const queue = await readPublishQueue()
      if (queue && queue.adsMessages.length > 0) {
        setAdsMessages(queue.adsMessages)
        setFromQueue(true)
        return
      }

      setFromQueue(false)
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

  useEffect(() => {
    function onStorageChanged(
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) {
      if (areaName !== 'local' || !(PUBLISH_QUEUE_STORAGE_KEY in changes)) return
      const next = parsePublishQueue(changes[PUBLISH_QUEUE_STORAGE_KEY]?.newValue)
      if (next && next.adsMessages.length > 0) {
        setAdsMessages(next.adsMessages)
        setFromQueue(true)
        setLoading(false)
        setError(null)
        return
      }
      void loadAds()
    }

    chrome.storage.onChanged.addListener(onStorageChanged)
    return () => chrome.storage.onChanged.removeListener(onStorageChanged)
  }, [loadAds])

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

  async function handleClearQueue() {
    const response = await sendMessage({ type: 'CLEAR_PUBLISH_QUEUE' })
    if (!response.ok) {
      setError(response.error)
      return
    }
    setReadyIds([])
    setFillingId(null)
    await loadAds()
  }

  async function publishAdMessage(adMessageId: string) {
    setError(null)
    setStatus(null)
    setFillingId(adMessageId)
    try {
      const response = await sendMessage({
        type: 'FILL_AD_MESSAGE',
        payload: { adMessageId },
      })
      if (!response.ok) {
        setError(response.error)
        return
      }
      if ('filled' in response && response.filled) {
        setReadyIds((prev) =>
          prev.includes(adMessageId) ? prev : [...prev, adMessageId],
        )
        setStatus('Diálogo listo. Revisa y pulsa Publicar en Facebook.')
      }
    } finally {
      setFillingId(null)
    }
  }

  function resetPublishButtons() {
    setReadyIds([])
    setFillingId(null)
    setError(null)
    setStatus(null)
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
        <p className="section-title">{fromQueue ? 'Cola de publicación' : 'Anuncios'}</p>
        <div className="selected-actions">
          {fromQueue && readyIds.length > 0 ? (
            <button
              type="button"
              className="btn-text"
              onClick={resetPublishButtons}
            >
              Reset
            </button>
          ) : null}
          {fromQueue ? (
            <button
              type="button"
              className="btn-text"
              disabled={loading || fillingId !== null}
              onClick={() => void handleClearQueue()}
            >
              Limpiar cola
            </button>
          ) : null}
          <button
            type="button"
            className="btn-text"
            disabled={loading || fillingId !== null}
            onClick={() => void loadAds()}
          >
            {loading ? 'Cargando…' : 'Actualizar'}
          </button>
        </div>
      </div>

      <p className="muted publish-hint">
        {fromQueue
          ? 'Pulsa Publicar en cada anuncio para abrir el diálogo de Facebook.'
          : 'Mensajes preparados para publicar en Facebook.'}
      </p>

      {error ? <p className="error">{error}</p> : null}
      {status ? <p className="success">{status}</p> : null}

      {loading && adsMessages.length === 0 ? (
        <div className="empty">Cargando anuncios…</div>
      ) : adsMessages.length === 0 ? (
        <div className="empty">
          No hay anuncios. Créalos en la web de vendedores.
        </div>
      ) : (
        <ul className="queue-list">
          {adsMessages.map((ad) => {
            const ready = readyIds.includes(ad.id)
            const filling = fillingId === ad.id
            return (
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
                    {ready ? (
                      <span className="queue-ready">Listo</span>
                    ) : null}
                  </div>
                </div>
                {fromQueue && !ready ? (
                  <button
                    type="button"
                    className="btn-publish-item"
                    disabled={fillingId !== null}
                    onClick={() => void publishAdMessage(ad.id)}
                  >
                    {filling ? 'Abriendo…' : 'Publicar'}
                  </button>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
