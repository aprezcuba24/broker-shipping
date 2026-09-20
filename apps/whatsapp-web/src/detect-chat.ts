import {
  cachedPhoneForChat,
  inspectInfoDrawer,
  isPhoneUnavailable,
  markPhoneUnavailable,
  rememberPhoneForChat,
  type DrawerInspection,
} from './contact-drawer'
import { formatPhone, looksLikePhone, normalizePhone } from './phone'

export type PhoneStatus = 'found' | 'unknown' | 'unavailable'

/** High-level chat classification from WhatsApp Web UI signals. */
export type ChatKind = 'group' | 'contact' | 'business' | 'unknown'

export type DetectedChat = {
  name: string | null
  phone: string | null
  isGroup: boolean
  phoneStatus: PhoneStatus
  /** group | contact | business | unknown */
  kind: ChatKind
  /** Human label in Spanish for the kind. */
  kindLabel: string
  /** Normalized presence when it looks like online / last seen / typing. */
  presence: string | null
  isBusiness: boolean
  isVerified: boolean
  /** true = saved name; false = title is a raw phone; null = unclear */
  isSavedContact: boolean | null
  about: string | null
  email: string | null
  website: string | null
  participantCount: number | null
  drawerOpen: boolean
}

export { formatPhone, looksLikePhone, normalizePhone } from './phone'

const UI_NOISE = [
  'en línea',
  'online',
  'last seen',
  'visto por última vez',
  'escribiendo',
  'typing',
  'grabando',
  'recording',
  'click here for contact info',
  'haz clic para ver la info. del contacto',
  'haz clic para ver la info del contacto',
  'haz clic para ver la info. del grupo',
  'haz clic para ver la info del grupo',
  'click here for group info',
  'info. del contacto',
  'info. del grupo',
  'contact info',
  'group info',
  'datos del contacto',
  'datos del grupo',
  'tú',
  'you',
  'whatsapp',
  'buscar',
  'search',
  'mensaje',
  'message',
  'menú',
  'menu',
  'llamada',
  'call',
  'videocall',
  'videollamada',
  'voice call',
  'video call',
  'mute',
  'silenciar',
]

function isUiNoise(value: string): boolean {
  const lower = value.trim().toLowerCase()
  if (!lower) return true
  return UI_NOISE.some((n) => lower === n || lower.startsWith(n))
}

function looksLikeIconLigature(value: string): boolean {
  const t = value.trim()
  if (t.startsWith('wds-ic-') || t.startsWith('wds-icon')) return true
  if (t.length === 0 || /\s/.test(t)) return false
  if (!(t.includes('-') || t.includes('_'))) return false
  return /^[a-z0-9_-]+$/.test(t)
}

function firstLine(value: string): string {
  return value.split(/\r?\n/)[0]?.trim() ?? ''
}

function isPlausibleLabel(value: string): boolean {
  const t = firstLine(value)
  if (!t || t.length > 80) return false
  if (isUiNoise(t) || looksLikeIconLigature(t)) return false
  return true
}

function conversationHeader(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>(
      'header[data-testid="conversation-header"]',
    ) ??
    document.querySelector<HTMLElement>('#main header') ??
    null
  )
}

/** Sticky only for chats confirmed by strong group signals. */
const knownGroupKeys = new Set<string>()

function rememberGroupKey(key: string | null | undefined): void {
  const k = key?.trim()
  if (k) knownGroupKeys.add(k)
}

function forgetGroupKey(key: string | null | undefined): void {
  const k = key?.trim()
  if (k) knownGroupKeys.delete(k)
}

function isKnownGroupKey(key: string | null | undefined): boolean {
  const k = key?.trim()
  return Boolean(k && knownGroupKeys.has(k))
}

function hasGroupMessageId(): boolean {
  return Boolean(document.querySelector('#main [data-id*="@g.us"]'))
}

function headerHasGroupInfoLabel(header: HTMLElement | null): boolean {
  if (!header) return false
  for (const el of header.querySelectorAll('[title], [aria-label]')) {
    const title = (
      el.getAttribute('title') ??
      el.getAttribute('aria-label') ??
      ''
    ).toLowerCase()
    if (/info\.?\s*del\s*grupo|group info|datos del grupo/.test(title)) {
      return true
    }
  }
  return false
}

/**
 * Strong subtitle signals for groups.
 * Avoid bare comma-lists (business taglines) and author heuristics
 * (1:1 often shows the same peer as name AND phone).
 */
function subtitleLooksLikeGroup(subtitle: string | null): boolean {
  if (!subtitle) return false
  if (classifyPresence(subtitle)) return false
  const t = subtitle.toLowerCase()
  if (/\d+\s+(participantes|participants|members)\b/.test(t)) return true
  if (/info\.?\s*del\s*grupo|group info|datos del grupo/.test(t)) return true
  // WA group member preview usually ends with "tú" / "you"
  const parts = subtitle.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 2) {
    const last = parts[parts.length - 1]?.toLowerCase() ?? ''
    if (last === 'tú' || last === 'tu' || last === 'you') return true
  }
  return false
}

function detectIsGroup(
  drawer: DrawerInspection | null,
  subtitle: string | null,
  header: HTMLElement | null,
): boolean {
  if (hasGroupMessageId()) return true
  if (drawer?.kind === 'group') return true
  if (headerHasGroupInfoLabel(header)) return true
  if (subtitleLooksLikeGroup(subtitle)) return true
  return false
}

/** Clear false sticky when the open chat looks like a clear 1:1. */
function looksLikeOneToOne(
  drawer: DrawerInspection | null,
  subtitle: string | null,
): boolean {
  if (hasGroupMessageId() || drawer?.kind === 'group') return false
  if (drawer?.kind === 'contact' || drawer?.kind === 'business') return true
  if (classifyPresence(subtitle)) return true
  return false
}

function readHeaderSubtitle(): string | null {
  const header = conversationHeader()
  if (!header) return null
  const el =
    header.querySelector<HTMLElement>(
      '[data-testid="conversation-info-header-chat-subtitle"]',
    ) ??
    header.querySelector<HTMLElement>('[data-testid="chat-subtitle"]') ??
    null
  if (!el) return null
  const raw = firstLine(el.getAttribute('title') ?? el.textContent ?? '')
  if (!raw || looksLikeIconLigature(raw)) return null
  return raw
}

function classifyPresence(subtitle: string | null): string | null {
  if (!subtitle) return null
  const t = subtitle.toLowerCase()
  if (/^en línea$|^online$/.test(t) || t.startsWith('en línea') || t === 'online') {
    return 'En línea'
  }
  if (/escribiendo|typing/.test(t)) return 'Escribiendo…'
  if (/grabando|recording/.test(t)) return 'Grabando audio…'
  if (/visto por última vez|last seen/.test(t)) return subtitle
  return null
}

function detectBusinessSignals(header: HTMLElement | null): boolean {
  if (!header) return false
  if (
    header.querySelector(
      '[data-testid*="business"], [data-icon*="business"], [aria-label*="business" i], [aria-label*="empresa" i]',
    )
  ) {
    return true
  }
  const blob = (header.textContent ?? '').toLowerCase()
  return /cuenta de empresa|cuenta comercial|business account|official business/.test(
    blob,
  )
}

function detectVerified(header: HTMLElement | null, drawer: DrawerInspection | null): boolean {
  if (drawer?.isVerified) return true
  if (!header) return false
  return Boolean(
    header.querySelector(
      '[data-icon*="verified"], [data-testid*="verified"], [aria-label*="verific" i]',
    ),
  )
}

function kindLabelFor(kind: ChatKind): string {
  switch (kind) {
    case 'group':
      return 'Grupo'
    case 'business':
      return 'Cuenta de empresa'
    case 'contact':
      return 'Contacto'
    default:
      return 'Desconocido'
  }
}

function participantCountFromSubtitle(subtitle: string | null): number | null {
  if (!subtitle) return null
  const m = subtitle.match(/^(\d+)\s+(participantes|participants|members)/i)
  if (m) return Number(m[1])
  // "Juan, María, Tú" style
  const parts = subtitle.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 2 && !classifyPresence(subtitle)) return parts.length
  return null
}

function detectHeaderLabel(): string | null {
  const dedicated = document.querySelector<HTMLElement>(
    '[data-testid="conversation-info-header-chat-title"]',
  )
  if (dedicated) {
    const raw =
      dedicated.getAttribute('title')?.trim() ||
      firstLine(dedicated.textContent ?? '')
    if (raw && isPlausibleLabel(raw)) return raw
  }

  const header = conversationHeader()
  if (!header) return null

  for (const el of header.querySelectorAll<HTMLElement>('[title]')) {
    const title = el.getAttribute('title')?.trim()
    if (!title || !isPlausibleLabel(title)) continue
    if (
      el.closest('div[role="button"]') &&
      el.closest(
        '[data-testid*="menu"], [data-testid*="search"], [data-testid*="call"]',
      )
    ) {
      continue
    }
    const text = firstLine(el.textContent ?? '')
    if (
      !text ||
      text === title ||
      text.startsWith(title) ||
      title.startsWith(text)
    ) {
      return title
    }
  }

  for (const el of header.querySelectorAll<HTMLElement>('[title]')) {
    const title = el.getAttribute('title')?.trim()
    if (title && isPlausibleLabel(title)) {
      if (/^(menú|menu|buscar|search)$/i.test(title)) continue
      return title
    }
  }

  for (const el of header.querySelectorAll<HTMLElement>(
    'span[dir="auto"], div[dir="auto"], span[dir="ltr"], span[dir="rtl"]',
  )) {
    if (el.querySelector('[dir]')) continue
    const text = firstLine(el.textContent ?? '')
    if (text && isPlausibleLabel(text)) return text
  }

  for (const el of header.querySelectorAll<HTMLElement>('span, div')) {
    if (el.children.length > 0) continue
    const text = firstLine(el.textContent ?? '')
    if (text && isPlausibleLabel(text)) return text
  }

  return null
}

function labelFromSelectedChatList(): string | null {
  const row =
    document.querySelector<HTMLElement>('#pane-side [aria-selected="true"]') ??
    document.querySelector<HTMLElement>(
      '#pane-side div[role="listitem"][aria-selected="true"]',
    )
  if (!row) return null

  for (const el of row.querySelectorAll<HTMLElement>('[title]')) {
    const title = el.getAttribute('title')?.trim()
    if (title && isPlausibleLabel(title)) return title
  }

  for (const el of row.querySelectorAll<HTMLElement>('span[dir="auto"]')) {
    if (el.querySelector('[dir]')) continue
    const text = firstLine(el.textContent ?? '')
    if (text && isPlausibleLabel(text)) return text
  }

  return null
}

function labelFromDocumentTitle(): string | null {
  const raw = document.title.trim()
  if (!raw) return null
  const cleaned = firstLine(
    raw.replace(/\s*[-–|]\s*WhatsApp.*$/i, '').replace(/\(\d+\)\s*/g, ''),
  )
  if (!cleaned || /^whatsapp$/i.test(cleaned)) return null
  return isPlausibleLabel(cleaned) ? cleaned : null
}

function authorFromPrePlainText(pre: string): string | null {
  const match = pre.match(/\]\s*(.+?):\s*$/)
  if (!match) return null
  const author = match[1]?.trim()
  return author || null
}

function authorsFromIncomingMessages(): string[] {
  const main = document.querySelector('#main')
  if (!main) return []

  const authors: string[] = []
  for (const el of main.querySelectorAll('[data-pre-plain-text]')) {
    const pre = el.getAttribute('data-pre-plain-text')
    if (!pre) continue
    const bubble = el.closest('.message-in, .message-out')
    if (bubble?.classList.contains('message-out')) continue
    const author = authorFromPrePlainText(pre)
    if (author) authors.push(author)
  }
  return authors
}

function mostCommon(values: string[]): string | null {
  if (values.length === 0) return null
  const counts = new Map<string, number>()
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  let best: string | null = null
  let bestCount = 0
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value
      bestCount = count
    }
  }
  return best
}

function authorsFromOutgoingMessages(): string[] {
  const main = document.querySelector('#main')
  if (!main) return []

  const authors: string[] = []
  for (const el of main.querySelectorAll('[data-pre-plain-text]')) {
    const pre = el.getAttribute('data-pre-plain-text')
    if (!pre) continue
    const bubble = el.closest('.message-in, .message-out')
    if (!bubble?.classList.contains('message-out')) continue
    const author = authorFromPrePlainText(pre)
    if (author) authors.push(author)
  }
  return authors
}

function nameFromIncomingMessages(): string | null {
  const ownNames = new Set(
    authorsFromOutgoingMessages().filter((a) => !looksLikePhone(a)),
  )
  const names = authorsFromIncomingMessages().filter(
    (a) => !looksLikePhone(a) && isPlausibleLabel(a) && !ownNames.has(a),
  )
  return mostCommon(names)
}

function phonesFromIncomingMessages(): string[] {
  return authorsFromIncomingMessages()
    .map((a) => normalizePhone(a))
    .filter((p): p is string => p != null)
}

function phonesFromDataId(root: ParentNode): string[] {
  const phones: string[] = []
  for (const el of root.querySelectorAll('[data-id]')) {
    const id = el.getAttribute('data-id')
    if (!id || id.includes('@g.us')) continue
    const match = id.match(/(\d{7,15})@c\.us/)
    if (match?.[1]) phones.push(match[1])
  }
  return phones
}

function chatKeyFor(name: string | null, phone: string | null): string {
  return `${name ?? ''}|${phone ?? ''}`
}

function identityKey(
  name: string | null,
  label: string | null,
): string | null {
  if (name) return name
  if (label && looksLikePhone(label)) return label
  return null
}

/**
 * Resolve phone for a 1:1 chat only. Groups never get a phone.
 * Opening the drawer once without a usable number marks the chat unavailable.
 */
function detectPhone(
  headerLabel: string | null,
  cacheKey: string | null,
  isGroup: boolean,
): { phone: string | null; status: PhoneStatus } {
  if (isGroup) {
    if (cacheKey) markPhoneUnavailable(cacheKey)
    return { phone: null, status: 'unavailable' }
  }

  if (cacheKey && isPhoneUnavailable(cacheKey)) {
    return { phone: null, status: 'unavailable' }
  }

  if (headerLabel && looksLikePhone(headerLabel)) {
    const phone = formatPhone(normalizePhone(headerLabel)!)
    if (cacheKey) rememberPhoneForChat(cacheKey, phone)
    return { phone, status: 'found' }
  }

  if (cacheKey) {
    const cached = cachedPhoneForChat(cacheKey)
    if (cached) return { phone: cached, status: 'found' }
  }

  const drawer = inspectInfoDrawer()
  if (drawer) {
    if (drawer.kind === 'group') {
      // Should not apply to 1:1, but if it appears, ignore phones entirely.
      if (cacheKey) markPhoneUnavailable(cacheKey)
      return { phone: null, status: 'unavailable' }
    }

    if (drawer.kind === 'contact' || drawer.kind === 'business') {
      if (drawer.phone) {
        if (cacheKey) rememberPhoneForChat(cacheKey, drawer.phone)
        return { phone: drawer.phone, status: 'found' }
      }
      // User opened contact/business info and there is no phone → stop trying.
      if (cacheKey) markPhoneUnavailable(cacheKey)
      return { phone: null, status: 'unavailable' }
    }

    // Unknown drawer (e.g. nested UI) — do not scrape; wait for a clear contact drawer.
  }

  const fromPre = mostCommon(phonesFromIncomingMessages())
  if (fromPre) {
    const phone = formatPhone(fromPre)
    if (cacheKey) rememberPhoneForChat(cacheKey, phone)
    return { phone, status: 'found' }
  }

  const main = document.querySelector('#main')
  if (main) {
    const any: string[] = []
    for (const el of main.querySelectorAll('[data-pre-plain-text]')) {
      const pre = el.getAttribute('data-pre-plain-text')
      if (!pre) continue
      const author = authorFromPrePlainText(pre)
      if (!author) continue
      const digits = normalizePhone(author)
      if (digits) any.push(digits)
    }
    const pick = mostCommon(any)
    if (pick) {
      const phone = formatPhone(pick)
      if (cacheKey) rememberPhoneForChat(cacheKey, phone)
      return { phone, status: 'found' }
    }

    const fromId = mostCommon(phonesFromDataId(main))
    if (fromId) {
      const phone = formatPhone(fromId)
      if (cacheKey) rememberPhoneForChat(cacheKey, phone)
      return { phone, status: 'found' }
    }
  }

  const header = conversationHeader()
  if (header) {
    for (const el of header.querySelectorAll('[title], [dir="auto"]')) {
      const raw =
        el.getAttribute('title')?.trim() || firstLine(el.textContent ?? '')
      if (raw && looksLikePhone(raw)) {
        const phone = formatPhone(normalizePhone(raw)!)
        if (cacheKey) rememberPhoneForChat(cacheKey, phone)
        return { phone, status: 'found' }
      }
    }
  }

  return { phone: null, status: 'unknown' }
}

export function detectCurrentChat(): DetectedChat {
  const empty: DetectedChat = {
    name: null,
    phone: null,
    isGroup: false,
    phoneStatus: 'unknown',
    kind: 'unknown',
    kindLabel: kindLabelFor('unknown'),
    presence: null,
    isBusiness: false,
    isVerified: false,
    isSavedContact: null,
    about: null,
    email: null,
    website: null,
    participantCount: null,
    drawerOpen: false,
  }

  const mainOpen = Boolean(
    document.querySelector('#main') ||
      document.querySelector('header[data-testid="conversation-header"]'),
  )

  if (!mainOpen) return empty

  const header = conversationHeader()
  const drawer = inspectInfoDrawer()
  const subtitle = readHeaderSubtitle()

  const label =
    detectHeaderLabel() ??
    labelFromSelectedChatList() ??
    labelFromDocumentTitle()

  let name: string | null = null
  if (label && !looksLikePhone(label)) {
    name = label
  }

  const cacheKey = identityKey(name, label)

  const liveGroup = detectIsGroup(drawer, subtitle, header)
  const oneToOne = looksLikeOneToOne(drawer, subtitle)

  if (oneToOne) {
    forgetGroupKey(cacheKey)
    forgetGroupKey(label)
    forgetGroupKey(name)
  }

  // Sticky only helps when group DOM signals flicker; never override a clear 1:1.
  let isGroup = oneToOne
    ? false
    : liveGroup ||
      isKnownGroupKey(cacheKey) ||
      isKnownGroupKey(label) ||
      isKnownGroupKey(name)

  if (isGroup && liveGroup) {
    rememberGroupKey(cacheKey)
    rememberGroupKey(label)
    rememberGroupKey(name)
  }

  const presence = isGroup ? null : classifyPresence(subtitle)
  const isBusiness =
    !isGroup &&
    (drawer?.isBusiness === true ||
      drawer?.kind === 'business' ||
      detectBusinessSignals(header))
  const isVerified = detectVerified(header, drawer)

  const { phone, status } = detectPhone(label, cacheKey, isGroup)

  if (!name && !phone && !isGroup) {
    name = nameFromIncomingMessages()
  }

  const resolvedName = name && !looksLikePhone(name) ? name : null
  if (isGroup && liveGroup && resolvedName) rememberGroupKey(resolvedName)

  const isSavedContact = isGroup
    ? null
    : resolvedName
      ? true
      : phone || (label && looksLikePhone(label))
        ? false
        : null

  let kind: ChatKind = 'unknown'
  if (isGroup) kind = 'group'
  else if (isBusiness) kind = 'business'
  else if (resolvedName || phone || label) kind = 'contact'

  let participantCount: number | null = null
  if (isGroup) {
    participantCount =
      drawer?.participantCount ?? participantCountFromSubtitle(subtitle)
  }

  return {
    name: resolvedName,
    phone,
    isGroup,
    phoneStatus: status,
    kind,
    kindLabel: kindLabelFor(kind),
    presence,
    isBusiness,
    isVerified,
    isSavedContact,
    about: drawer?.about ?? null,
    email: drawer?.email ?? null,
    website: drawer?.website ?? null,
    participantCount,
    drawerOpen: Boolean(drawer),
  }
}

export type ChatWatcher = {
  stop: () => void
}

export function watchCurrentChat(
  onChange: (chat: DetectedChat) => void,
  debounceMs = 150,
): ChatWatcher {
  let lastKey = ''
  let timer: ReturnType<typeof setTimeout> | null = null
  let panelObserver: MutationObserver | null = null

  const emit = () => {
    const chat = detectCurrentChat()
    const key = [
      chatKeyFor(chat.name, chat.phone),
      chat.kind,
      chat.phoneStatus,
      chat.presence ?? '',
      chat.about ?? '',
      chat.email ?? '',
      String(chat.participantCount ?? ''),
      String(chat.isVerified),
      String(chat.drawerOpen),
    ].join('|')
    if (key === lastKey) return
    lastKey = key
    console.info('[Vendelo360] chat', chat)
    onChange(chat)
  }

  const schedule = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(emit, debounceMs)
  }

  const attachPanelObserver = () => {
    panelObserver?.disconnect()
    panelObserver = null
    const target = document.querySelector('#app') ?? document.body
    panelObserver = new MutationObserver(schedule)
    panelObserver.observe(target, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [
        'title',
        'data-pre-plain-text',
        'data-id',
        'aria-selected',
        'data-testid',
      ],
    })
  }

  attachPanelObserver()
  emit()

  return {
    stop: () => {
      if (timer) clearTimeout(timer)
      panelObserver?.disconnect()
    },
  }
}
