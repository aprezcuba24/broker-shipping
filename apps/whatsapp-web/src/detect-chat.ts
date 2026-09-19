import {
  cachedPhoneForChat,
  inspectInfoDrawer,
  isPhoneUnavailable,
  markPhoneUnavailable,
  rememberPhoneForChat,
} from './contact-drawer'
import { formatPhone, looksLikePhone, normalizePhone } from './phone'

export type PhoneStatus = 'found' | 'unknown' | 'unavailable'

export type DetectedChat = {
  /** Visible contact/group name when it is not just a phone number. */
  name: string | null
  /** Phone when WhatsApp exposes it for a 1:1 chat. */
  phone: string | null
  /** True when the open conversation is a group. */
  isGroup: boolean
  /**
   * found — have a number
   * unavailable — group, or drawer opened once without a usable number
   * unknown — still might appear (e.g. unsaved header phone not seen yet)
   */
  phoneStatus: PhoneStatus
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

function detectIsGroup(): boolean {
  const main = document.querySelector('#main')
  if (main?.querySelector('[data-id*="@g.us"]')) return true

  const header = conversationHeader()
  if (header) {
    const subtitle =
      header.querySelector<HTMLElement>(
        '[data-testid="conversation-info-header-chat-subtitle"]',
      ) ?? null
    const subText = (
      subtitle?.getAttribute('title') ??
      subtitle?.textContent ??
      ''
    ).toLowerCase()
    if (
      /grupo|group info|info\.?\s*del\s*grupo|participantes|participants/.test(
        subText,
      )
    ) {
      return true
    }

    // Header copy that points at group info
    for (const el of header.querySelectorAll('[title]')) {
      const title = (el.getAttribute('title') ?? '').toLowerCase()
      if (/info\.?\s*del\s*grupo|group info/.test(title)) return true
    }
  }

  const drawer = inspectInfoDrawer()
  if (drawer?.kind === 'group') return true

  return false
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

    if (drawer.kind === 'contact') {
      if (drawer.phone) {
        if (cacheKey) rememberPhoneForChat(cacheKey, drawer.phone)
        return { phone: drawer.phone, status: 'found' }
      }
      // User opened contact info and there is no phone → stop trying.
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
  const mainOpen = Boolean(
    document.querySelector('#main') ||
      document.querySelector('header[data-testid="conversation-header"]'),
  )

  if (!mainOpen) {
    return {
      name: null,
      phone: null,
      isGroup: false,
      phoneStatus: 'unknown',
    }
  }

  const isGroup = detectIsGroup()

  const label =
    detectHeaderLabel() ??
    labelFromSelectedChatList() ??
    labelFromDocumentTitle()

  let name: string | null = null
  if (label && !looksLikePhone(label)) {
    name = label
  }

  const cacheKey = identityKey(name, label)
  const { phone, status } = detectPhone(label, cacheKey, isGroup)

  if (!name && !phone && !isGroup) {
    name = nameFromIncomingMessages()
  }

  return {
    name: name && !looksLikePhone(name) ? name : null,
    phone,
    isGroup,
    phoneStatus: status,
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
    const key = `${chatKeyFor(chat.name, chat.phone)}|${chat.isGroup}|${chat.phoneStatus}`
    if (key === lastKey) return
    lastKey = key
    console.info('[Broker WA POC] chat', chat)
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
