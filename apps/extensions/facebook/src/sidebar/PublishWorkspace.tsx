import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { SELLER_APP_URL, type SessionPublic } from '@broker/extension-auth'
import { sendMessage } from '../auth/messaging'
import { PUBLISH_DRAFT_STORAGE_KEY } from '../constants'
import type { FacebookGroup, PreparedTab, ProductSummary } from '../auth/types'
import {
  buildFacebookShareCode,
  buildPostHtml,
  buildPostText,
  buildWhatsAppProductLink,
  buildWhatsAppProductText,
} from '../share-link'

type AuthenticatedSession = Exclude<SessionPublic, { status: 'loggedOut' }>

type Props = {
  session: AuthenticatedSession & { status: 'ready' }
  onSelectOrg: (organizationId: string) => Promise<void>
}

type PublishDraft = {
  query: string
  products: ProductSummary[]
  selected: ProductSummary | null
  caption: string
  selectedGroupIndexes: number[]
  doneGroupIndexes: number[]
}

const SEARCH_DEBOUNCE_MS = 350

const EMPTY_DRAFT: PublishDraft = {
  query: '',
  products: [],
  selected: null,
  caption: '',
  selectedGroupIndexes: [],
  doneGroupIndexes: [],
}

function allIndexes(length: number): number[] {
  return Array.from({ length }, (_, i) => i)
}

export function PublishWorkspace({ session, onSelectOrg }: Props) {
  const phone = session.user.phone
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<ProductSummary[]>([])
  const [selected, setSelected] = useState<ProductSummary | null>(null)
  const [caption, setCaption] = useState('')
  const [groups, setGroups] = useState<FacebookGroup[]>([])
  const [selectedGroupIndexes, setSelectedGroupIndexes] = useState<number[]>([])
  const [doneGroupIndexes, setDoneGroupIndexes] = useState<number[]>([])
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [lastOpenedTabs, setLastOpenedTabs] = useState<PreparedTab[]>([])
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [groupsReady, setGroupsReady] = useState(false)
  const [selectionSeeded, setSelectionSeeded] = useState(false)

  useEffect(() => {
    void chrome.storage.local.get(PUBLISH_DRAFT_STORAGE_KEY).then((data) => {
      const draft = data[PUBLISH_DRAFT_STORAGE_KEY] as
        | Partial<PublishDraft>
        | undefined
      if (draft && typeof draft === 'object') {
        setQuery(typeof draft.query === 'string' ? draft.query : '')
        setProducts(Array.isArray(draft.products) ? draft.products : [])
        setSelected(draft.selected ?? null)
        setCaption(typeof draft.caption === 'string' ? draft.caption : '')
        setDoneGroupIndexes(
          Array.isArray(draft.doneGroupIndexes) ? draft.doneGroupIndexes : [],
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
    void sendMessage({ type: 'GET_GROUPS' }).then((response) => {
      if (response.ok && 'groups' in response) {
        setGroups(response.groups)
      } else if (!response.ok) {
        setError(response.error)
      }
      setGroupsReady(true)
    })
  }, [])

  // Default: all groups selected once on first load (not after a cleared selection).
  useEffect(() => {
    if (!hydrated || !groupsReady || groups.length === 0 || selectionSeeded) {
      return
    }
    setSelectedGroupIndexes(allIndexes(groups.length))
    setSelectionSeeded(true)
  }, [hydrated, groupsReady, groups.length, selectionSeeded])

  useEffect(() => {
    if (!hydrated) return
    const draft: PublishDraft = {
      query,
      products,
      selected,
      caption,
      selectedGroupIndexes,
      doneGroupIndexes,
    }
    void chrome.storage.local.set({ [PUBLISH_DRAFT_STORAGE_KEY]: draft })
  }, [
    hydrated,
    query,
    products,
    selected,
    caption,
    selectedGroupIndexes,
    doneGroupIndexes,
  ])

  const searchProducts = useEffectEvent(async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) {
      setProducts([])
      setSearching(false)
      setStatus(null)
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
        return
      }
      if ('products' in response) {
        setProducts(response.products)
        setStatus(
          response.products.length === 0
            ? 'No hay productos con ese nombre.'
            : null,
        )
      }
    } finally {
      setSearching(false)
    }
  })

  useEffect(() => {
    if (!hydrated) return
    const trimmed = query.trim()
    if (!trimmed) {
      setProducts([])
      setSearching(false)
      return
    }
    setSearching(true)
    const handle = window.setTimeout(() => {
      void searchProducts(query)
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [query, hydrated])

  const waLink = useMemo(() => {
    if (!selected || !phone) return null
    return buildWhatsAppProductLink(phone, selected.name, selected.public_code)
  }, [selected, phone])

  const postText = useMemo(() => {
    if (!selected || !phone) return ''
    return buildPostText(
      selected.name,
      caption,
      phone,
      selected.public_code,
      selected.price,
      selected.sale_price,
    )
  }, [caption, selected, phone])

  const postHtml = useMemo(() => {
    if (!selected || !phone) return ''
    return buildPostHtml(
      selected.name,
      caption,
      phone,
      selected.public_code,
      selected.price,
      selected.sale_price,
    )
  }, [caption, selected, phone])

  const publishTargets = useMemo(
    () =>
      selectedGroupIndexes.filter(
        (index) => index >= 0 && index < groups.length,
      ),
    [selectedGroupIndexes, groups.length],
  )

  function selectProduct(product: ProductSummary) {
    setSelected(product)
    setCaption(product.description?.trim() ?? '')
    setDetailsOpen(false)
  }

  function clearDraft() {
    setSelected(null)
    setCaption('')
    setQuery('')
    setProducts([])
    setDoneGroupIndexes([])
    setSelectedGroupIndexes(allIndexes(groups.length))
    setLastOpenedTabs([])
    setDetailsOpen(false)
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

  async function publishToSelectedGroups() {
    if (!selected || !phone) return
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
    setPreparing(true)

    try {
      const response = await sendMessage({
        type: 'PREPARE_POSTS',
        payload: {
          text: postText,
          html: postHtml,
          imageUrl: selected.image_url,
          groups: targetGroups,
        },
      })
      if (!response.ok) {
        setError(response.error)
        return
      }
      if ('message' in response) setStatus(response.message)
      if ('tabs' in response && Array.isArray(response.tabs)) {
        setLastOpenedTabs(response.tabs)
      }

      // Mark attempted groups as done and uncheck them for a second pass on others.
      const nextDone = [
        ...new Set([...doneGroupIndexes, ...publishTargets]),
      ].sort((a, b) => a - b)
      setDoneGroupIndexes(nextDone)
      setSelectedGroupIndexes((prev) =>
        prev.filter((i) => !publishTargets.includes(i)),
      )
    } finally {
      setPreparing(false)
    }
  }

  async function retryLastTabs() {
    if (!selected || !phone) return
    if (lastOpenedTabs.length === 0) {
      setError('Primero publica al menos un grupo')
      return
    }

    setError(null)
    setStatus(null)
    setRetrying(true)

    try {
      const response = await sendMessage({
        type: 'RETRY_POSTS',
        payload: {
          text: postText,
          html: postHtml,
          imageUrl: selected.image_url,
          tabs: lastOpenedTabs,
        },
      })
      if (!response.ok) {
        setError(response.error)
        return
      }
      if ('message' in response) setStatus(response.message)
      if ('tabs' in response && Array.isArray(response.tabs)) {
        setLastOpenedTabs(response.tabs)
      }
    } finally {
      setRetrying(false)
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
      <div className="search-wrap">
        <input
          className="search-input"
          type="search"
          placeholder="Buscar por nombre…"
          aria-label="Buscar producto"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {searching ? (
          <span className="search-spinner" aria-label="Buscando" role="status" />
        ) : null}
      </div>

      {products.length > 0 ? (
        <ul className="product-list">
          {products.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                className={`product-item${selected?.id === product.id ? ' selected' : ''}`}
                onClick={() => selectProduct(product)}
              >
                {product.image_url ? (
                  <img className="product-thumb" src={product.image_url} alt="" />
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
          ))}
        </ul>
      ) : null}

      {selected ? (
        <>
          <div className="selected-row">
            <p className="muted selected-name">
              <strong>{selected.name}</strong>
            </p>
            <button
              type="button"
              className="btn-text"
              onClick={clearDraft}
            >
              Cambiar
            </button>
          </div>
          <button
            type="button"
            className="details-toggle"
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((open) => !open)}
          >
            {detailsOpen
              ? 'Ocultar descripción y vista previa'
              : 'Editar descripción / vista previa'}
          </button>
          {detailsOpen ? (
            <div className="details-panel">
              <label className="field">
                <span>Descripción</span>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </label>
              <p className="section-title">Vista previa del post</p>
              <div
                className="card preview-card"
                dangerouslySetInnerHTML={{ __html: postHtml }}
              />
              {waLink ? (
                <p className="preview-link" title={waLink}>
                  Texto del enlace WA:{' '}
                  {buildWhatsAppProductText(
                    selected.name,
                    selected.public_code,
                  )}
                </p>
              ) : null}
            </div>
          ) : null}
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
            const done = doneGroupIndexes.includes(index)
            return (
              <li key={`${group.url}-${index}`}>
                <label
                  className={`group-item${checked ? ' selected' : ''}${done ? ' done' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleGroup(index)}
                  />
                  <span className="group-item-name">{group.name}</span>
                  {done ? <span className="muted">Hecho</span> : null}
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
            !selected || preparing || retrying || publishTargets.length === 0
          }
          onClick={() => void publishToSelectedGroups()}
        >
          {preparing
            ? 'Abriendo grupos…'
            : publishTargets.length > 1
              ? `Publicar en ${publishTargets.length} grupos`
              : 'Publicar'}
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={
            !selected ||
            preparing ||
            retrying ||
            lastOpenedTabs.length === 0
          }
          onClick={() => void retryLastTabs()}
        >
          {retrying
            ? 'Reintentando…'
            : lastOpenedTabs.length > 1
              ? `Reintentar (${lastOpenedTabs.length} pestañas)`
              : 'Reintentar'}
        </button>
      </div>
    </>
  )
}
