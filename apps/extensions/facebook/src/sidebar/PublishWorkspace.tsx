import { useEffect, useEffectEvent, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { SELLER_APP_URL, type SessionPublic } from '@broker/extension-auth'
import { sendMessage } from '../auth/messaging'
import {
  PUBLISH_DRAFT_STORAGE_KEY,
  TAB_SESSIONS_STORAGE_KEY,
} from '../constants'
import type {
  FacebookGroup,
  ProductSummary,
  QueuedProduct,
  TabPublishSession,
} from '../auth/types'
import {
  buildFacebookShareCode,
  buildPostHtml,
  buildWhatsAppProductLink,
  buildWhatsAppProductText,
} from '../share-link'

type AuthenticatedSession = Exclude<SessionPublic, { status: 'loggedOut' }>

type Props = {
  session: AuthenticatedSession & { status: 'ready' }
  onSelectOrg: (organizationId: string) => Promise<void>
}

type PublishDraft = {
  queue: QueuedProduct[]
  expandedProductId: string | null
  selectedGroupIndexes: number[]
}

const SEARCH_DEBOUNCE_MS = 350

const EMPTY_DRAFT: PublishDraft = {
  queue: [],
  expandedProductId: null,
  selectedGroupIndexes: [],
}

function allIndexes(length: number): number[] {
  return Array.from({ length }, (_, i) => i)
}

function PublishMode({
  tabSession,
  leaving,
  onLeave,
  onStatus,
  onError,
}: {
  tabSession: TabPublishSession
  leaving: boolean
  onLeave: () => void
  onStatus: (message: string | null) => void
  onError: (message: string | null) => void
}) {
  const [fillingId, setFillingId] = useState<string | null>(null)
  const [readyIds, setReadyIds] = useState<string[]>([])

  async function publishProduct(productId: string) {
    onError(null)
    onStatus(null)
    setFillingId(productId)
    try {
      const response = await sendMessage({
        type: 'FILL_PRODUCT',
        payload: { tabId: tabSession.tabId, productId },
      })
      if (!response.ok) {
        onError(response.error)
        return
      }
      if ('filled' in response && response.filled) {
        setReadyIds((prev) =>
          prev.includes(productId) ? prev : [...prev, productId],
        )
        onStatus('Diálogo listo. Revisa y pulsa Publicar en Facebook.')
      }
    } finally {
      setFillingId(null)
    }
  }

  function resetPublishButtons() {
    setReadyIds([])
    setFillingId(null)
    onError(null)
    onStatus(null)
  }

  return (
    <>
      <div className="selected-row">
        <p className="section-title">Publicar en «{tabSession.groupName}»</p>
        <div className="selected-actions">
          <button
            type="button"
            className="btn-text"
            title="Volver a seleccionar productos"
            disabled={leaving || fillingId !== null}
            onClick={onLeave}
          >
            {leaving ? 'Volviendo…' : 'Volver'}
          </button>
          {readyIds.length > 0 ? (
            <button
              type="button"
              className="btn-text"
              onClick={resetPublishButtons}
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>
      <p className="muted publish-hint">
        Pulsa Publicar en cada producto para abrir el diálogo de Facebook.
      </p>
      <ul className="queue-list">
        {tabSession.products.map(({ product }) => {
          const ready = readyIds.includes(product.id)
          const filling = fillingId === product.id
          return (
            <li key={product.id} className="queue-item">
              <div className="queue-item-main">
                {product.image_url ? (
                  <img
                    className="product-thumb"
                    src={product.image_url}
                    alt=""
                  />
                ) : (
                  <div className="product-thumb" />
                )}
                <div className="queue-item-info">
                  <p className="product-name">{product.name}</p>
                  <p className="product-code">
                    {buildFacebookShareCode(product.public_code)}
                  </p>
                  {ready ? (
                    <span className="queue-ready">Listo</span>
                  ) : null}
                </div>
              </div>
              {ready ? null : (
                <button
                  type="button"
                  className="btn-publish-item"
                  disabled={fillingId !== null}
                  onClick={() => void publishProduct(product.id)}
                >
                  {filling ? 'Abriendo…' : 'Publicar'}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}

export function PublishWorkspace({ session, onSelectOrg }: Props) {
  const phone = session.user.phone
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<ProductSummary[]>([])
  const [queue, setQueue] = useState<QueuedProduct[]>([])
  const [expandedProductId, setExpandedProductId] = useState<string | null>(
    null,
  )
  const [groups, setGroups] = useState<FacebookGroup[]>([])
  const [selectedGroupIndexes, setSelectedGroupIndexes] = useState<number[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [opening, setOpening] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [groupsReady, setGroupsReady] = useState(false)
  const [selectionSeeded, setSelectionSeeded] = useState(false)
  const [tabSession, setTabSession] = useState<TabPublishSession | null>(null)
  const [tabSessionReady, setTabSessionReady] = useState(false)
  const [leavingPublish, setLeavingPublish] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void sendMessage({ type: 'GET_TAB_SESSION' }).then((response) => {
      if (response.ok && 'tabSession' in response) {
        setTabSession(response.tabSession)
      }
      setTabSessionReady(true)
    })
  }, [])

  useEffect(() => {
    function onStorageChanged(
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) {
      if (area !== 'local' || !(TAB_SESSIONS_STORAGE_KEY in changes)) return
      void sendMessage({ type: 'GET_TAB_SESSION' }).then((response) => {
        if (response.ok && 'tabSession' in response) {
          setTabSession(response.tabSession)
        }
      })
    }
    chrome.storage.onChanged.addListener(onStorageChanged)
    return () => chrome.storage.onChanged.removeListener(onStorageChanged)
  }, [])

  useEffect(() => {
    void chrome.storage.local.get(PUBLISH_DRAFT_STORAGE_KEY).then((data) => {
      const draft = data[PUBLISH_DRAFT_STORAGE_KEY] as
        | Partial<PublishDraft>
        | undefined
      if (draft && typeof draft === 'object') {
        if (Array.isArray(draft.queue)) {
          setQueue(draft.queue)
        }
        setExpandedProductId(
          typeof draft.expandedProductId === 'string'
            ? draft.expandedProductId
            : null,
        )
        if (Array.isArray(draft.selectedGroupIndexes)) {
          setSelectedGroupIndexes(draft.selectedGroupIndexes)
          setSelectionSeeded(true)
        }
      }
      setHydrated(true)
    })
  }, [])

  useEffect(() => {
    if (!searchOpen) return
    function onPointerDown(event: MouseEvent) {
      const root = autocompleteRef.current
      if (!root) return
      // Shadow DOM retargets event.target to the host; use composedPath.
      if (!event.composedPath().includes(root)) {
        setSearchOpen(false)
        setHighlightIndex(-1)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [searchOpen])

  useEffect(() => {
    if (tabSession) return
    void sendMessage({ type: 'GET_GROUPS' }).then((response) => {
      if (response.ok && 'groups' in response) {
        setGroups(response.groups)
      } else if (!response.ok) {
        setError(response.error)
      }
      setGroupsReady(true)
    })
  }, [tabSession])

  // Default: all groups selected once on first load (not after a cleared selection).
  useEffect(() => {
    if (
      tabSession ||
      !hydrated ||
      !groupsReady ||
      groups.length === 0 ||
      selectionSeeded
    ) {
      return
    }
    setSelectedGroupIndexes(allIndexes(groups.length))
    setSelectionSeeded(true)
  }, [tabSession, hydrated, groupsReady, groups.length, selectionSeeded])

  useEffect(() => {
    if (!hydrated || tabSession) return
    const draft: PublishDraft = {
      queue,
      expandedProductId,
      selectedGroupIndexes,
    }
    void chrome.storage.local.set({ [PUBLISH_DRAFT_STORAGE_KEY]: draft })
  }, [hydrated, tabSession, queue, expandedProductId, selectedGroupIndexes])

  const searchProducts = useEffectEvent(async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) {
      setProducts([])
      setSearching(false)
      return
    }
    setError(null)
    setSearching(true)
    try {
      const response = await sendMessage({
        type: 'SEARCH_PRODUCTS',
        query: trimmed,
      })
      if (!response.ok) {
        setError(response.error)
        setProducts([])
        return
      }
      if ('products' in response) {
        setProducts(response.products)
        setSearchOpen(true)
        setHighlightIndex(0)
      }
    } finally {
      setSearching(false)
    }
  })

  useEffect(() => {
    if (!hydrated || tabSession) return
    const trimmed = query.trim()
    if (!trimmed) {
      setProducts([])
      setSearching(false)
      setHighlightIndex(-1)
      return
    }
    setSearching(true)
    const handle = window.setTimeout(() => {
      void searchProducts(query)
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [query, hydrated, tabSession])

  const queuedIds = useMemo(
    () => new Set(queue.map((item) => item.product.id)),
    [queue],
  )

  const suggestions = useMemo(
    () => products.filter((product) => !queuedIds.has(product.id)),
    [products, queuedIds],
  )

  const showDropdown = searchOpen && query.trim().length > 0

  const publishTargets = useMemo(
    () =>
      selectedGroupIndexes.filter(
        (index) => index >= 0 && index < groups.length,
      ),
    [selectedGroupIndexes, groups.length],
  )

  function addProductToQueue(product: ProductSummary) {
    setQueue((prev) => {
      if (prev.some((item) => item.product.id === product.id)) return prev
      return [
        ...prev,
        {
          product,
          caption: product.description?.trim() ?? '',
        },
      ]
    })
    setQuery('')
    setProducts([])
    setSearchOpen(false)
    setHighlightIndex(-1)
    setError(null)
    setStatus(`Añadido: ${product.name}`)
    requestAnimationFrame(() => searchInputRef.current?.focus())
  }

  function removeFromQueue(productId: string) {
    setQueue((prev) => prev.filter((item) => item.product.id !== productId))
    setExpandedProductId((prev) => (prev === productId ? null : prev))
  }

  function updateCaption(productId: string, caption: string) {
    setQueue((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, caption } : item,
      ),
    )
  }

  function clearQueue() {
    setQueue([])
    setExpandedProductId(null)
    setQuery('')
    setProducts([])
    setSearchOpen(false)
    setHighlightIndex(-1)
    setSelectedGroupIndexes(allIndexes(groups.length))
    setStatus(null)
    setError(null)
    void chrome.storage.local.set({
      [PUBLISH_DRAFT_STORAGE_KEY]: {
        ...EMPTY_DRAFT,
        selectedGroupIndexes: allIndexes(groups.length),
      },
    })
  }

  function toggleGroup(index: number) {
    setSelectedGroupIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    )
    setStatus(null)
    setError(null)
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) return

    if (event.key === 'Escape') {
      event.preventDefault()
      setSearchOpen(false)
      setHighlightIndex(-1)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (suggestions.length === 0) return
      setHighlightIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0,
      )
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (suggestions.length === 0) return
      setHighlightIndex((prev) =>
        prev <= 0 ? suggestions.length - 1 : prev - 1,
      )
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const picked =
        highlightIndex >= 0
          ? suggestions[highlightIndex]
          : suggestions[0]
      if (picked) addProductToQueue(picked)
    }
  }

  async function leavePublishMode() {
    setError(null)
    setStatus(null)
    setLeavingPublish(true)
    try {
      const response = await sendMessage({ type: 'LEAVE_PUBLISH' })
      if (!response.ok) {
        setError(response.error)
        return
      }
      setTabSession(null)
    } finally {
      setLeavingPublish(false)
    }
  }

  async function startOpeningGroups() {
    if (!phone) return
    if (queue.length === 0) {
      setError('Añade al menos un producto')
      return
    }
    if (publishTargets.length === 0) {
      setError('Selecciona al menos un grupo')
      return
    }

    const targetGroups = publishTargets
      .map((index) => groups[index])
      .filter((g): g is FacebookGroup => Boolean(g))

    if (targetGroups.length === 0) {
      setError('No hay grupos válidos seleccionados')
      return
    }

    setError(null)
    setStatus(null)
    setOpening(true)

    try {
      const response = await sendMessage({
        type: 'OPEN_GROUPS',
        payload: {
          groups: targetGroups,
          products: queue,
          phone,
        },
      })
      if (!response.ok) {
        setError(response.error)
        return
      }
      if ('message' in response) setStatus(response.message)
    } finally {
      setOpening(false)
    }
  }

  if (!phone) {
    return (
      <div className="gate">
        <h2 className="gate-title">Teléfono requerido</h2>
        <p className="gate-text">
          Completa el teléfono de tu perfil para generar el enlace de WhatsApp.
        </p>
        <a
          className="btn-gate"
          href={SELLER_APP_URL}
          target="_blank"
          rel="noreferrer"
        >
          Abrir perfil
        </a>
      </div>
    )
  }

  if (!tabSessionReady) {
    return <div className="empty">Cargando…</div>
  }

  if (tabSession) {
    return (
      <>
        <PublishMode
          tabSession={tabSession}
          leaving={leavingPublish}
          onLeave={() => void leavePublishMode()}
          onStatus={setStatus}
          onError={setError}
        />
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        {status ? (
          <p className="success" role="status">
            {status}
          </p>
        ) : null}
      </>
    )
  }

  return (
    <>
      {session.organizations.length > 1 ? (
        <label className="field">
          <span>Organización</span>
          <select
            value={session.organizationId ?? ''}
            onChange={(e) => void onSelectOrg(e.target.value)}
          >
            {session.organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <p className="section-title">Producto</p>
      <div className="autocomplete" ref={autocompleteRef}>
        <div className="search-wrap">
          <input
            ref={searchInputRef}
            className="search-input"
            type="search"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls="product-autocomplete-list"
            aria-autocomplete="list"
            aria-activedescendant={
              highlightIndex >= 0 && suggestions[highlightIndex]
                ? `product-option-${suggestions[highlightIndex]!.id}`
                : undefined
            }
            placeholder="Buscar y añadir productos…"
            aria-label="Buscar producto"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => {
              if (query.trim()) setSearchOpen(true)
            }}
            onKeyDown={onSearchKeyDown}
            autoComplete="off"
          />
          {searching ? (
            <span
              className="search-spinner"
              aria-label="Buscando"
              role="status"
            />
          ) : null}
        </div>
        {showDropdown ? (
          <ul
            id="product-autocomplete-list"
            className="autocomplete-dropdown"
            role="listbox"
          >
            {searching && products.length === 0 ? (
              <li className="autocomplete-empty">Buscando…</li>
            ) : suggestions.length === 0 ? (
              <li className="autocomplete-empty">
                {products.length > 0
                  ? 'Todos los resultados ya están en la cola'
                  : 'No hay productos con ese nombre'}
              </li>
            ) : (
              suggestions.map((product, index) => (
                <li key={product.id} role="presentation">
                  <button
                    type="button"
                    id={`product-option-${product.id}`}
                    role="option"
                    aria-selected={index === highlightIndex}
                    className={`autocomplete-option${index === highlightIndex ? ' is-active' : ''}`}
                    onMouseEnter={() => setHighlightIndex(index)}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      addProductToQueue(product)
                    }}
                  >
                    {product.image_url ? (
                      <img
                        className="product-thumb"
                        src={product.image_url}
                        alt=""
                      />
                    ) : (
                      <div className="product-thumb" />
                    )}
                    <div>
                      <p className="product-name">{product.name}</p>
                      <p className="product-code">
                        {buildFacebookShareCode(product.public_code)}
                      </p>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>

      {queue.length > 0 ? (
        <>
          <div className="selected-row">
            <p className="section-title">Cola ({queue.length})</p>
            <button type="button" className="btn-text" onClick={clearQueue}>
              Vaciar
            </button>
          </div>
          <ul className="queue-list">
            {queue.map(({ product, caption }) => {
              const expanded = expandedProductId === product.id
              const waLink = buildWhatsAppProductLink(
                phone,
                product.name,
                product.public_code,
              )
              const postHtml = buildPostHtml(
                product.name,
                caption,
                phone,
                product.public_code,
                product.price,
                product.sale_price,
              )
              return (
                <li key={product.id} className="queue-card">
                  <div className="queue-item">
                    <div className="queue-item-main">
                      {product.image_url ? (
                        <img
                          className="product-thumb"
                          src={product.image_url}
                          alt=""
                        />
                      ) : (
                        <div className="product-thumb" />
                      )}
                      <div className="queue-item-info">
                        <p className="product-name">{product.name}</p>
                        <p className="product-code">
                          {buildFacebookShareCode(product.public_code)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-text"
                      onClick={() => removeFromQueue(product.id)}
                    >
                      Quitar
                    </button>
                  </div>
                  <button
                    type="button"
                    className="details-toggle"
                    aria-expanded={expanded}
                    onClick={() =>
                      setExpandedProductId((prev) =>
                        prev === product.id ? null : product.id,
                      )
                    }
                  >
                    {expanded
                      ? 'Ocultar descripción y vista previa'
                      : 'Editar descripción / vista previa'}
                  </button>
                  {expanded ? (
                    <div className="details-panel">
                      <label className="field">
                        <span>Descripción</span>
                        <textarea
                          value={caption}
                          onChange={(e) =>
                            updateCaption(product.id, e.target.value)
                          }
                        />
                      </label>
                      <p className="section-title">Vista previa del post</p>
                      <div
                        className="card preview-card"
                        dangerouslySetInnerHTML={{ __html: postHtml }}
                      />
                      <p className="preview-link" title={waLink}>
                        Texto del enlace WA:{' '}
                        {buildWhatsAppProductText(
                          product.name,
                          product.public_code,
                        )}
                      </p>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </>
      ) : null}

      <p className="section-title">Grupos</p>
      {groups.length === 0 ? (
        <p className="muted">
          Añade grupos en <code>config/groups.json</code> y vuelve a compilar.
        </p>
      ) : (
        <ul className="group-list">
          {groups.map((group, index) => {
            const checked = selectedGroupIndexes.includes(index)
            return (
              <li key={`${group.url}-${index}`}>
                <label
                  className={`group-item${checked ? ' selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleGroup(index)}
                  />
                  <span className="group-item-name">{group.name}</span>
                </label>
              </li>
            )
          })}
        </ul>
      )}

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {status ? (
        <p className="success" role="status">
          {status}
        </p>
      ) : null}

      <div className="actions">
        <button
          type="button"
          className="btn-primary"
          disabled={
            queue.length === 0 || opening || publishTargets.length === 0
          }
          onClick={() => void startOpeningGroups()}
        >
          {opening
            ? 'Abriendo grupos…'
            : publishTargets.length > 1
              ? `Comenzar en ${publishTargets.length} grupos`
              : 'Comenzar'}
        </button>
      </div>
    </>
  )
}
