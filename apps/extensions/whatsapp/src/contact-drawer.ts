import { formatPhone, looksLikePhone, normalizePhone } from './phone'

const CONTACT_DRAWER_HEADINGS = [
  'datos del contacto',
  'info. del contacto',
  'info del contacto',
  'contact info',
  'contact info.',
  'información del contacto',
  'kontaktinfo',
  'infos du contact',
  'dados do contato',
  'datos de la empresa',
  'business info',
  'información de la empresa',
  'info. de la empresa',
]

const GROUP_DRAWER_HEADINGS = [
  'datos del grupo',
  'info. del grupo',
  'info del grupo',
  'group info',
  'información del grupo',
  'dados do grupo',
  'infos du groupe',
]

const BUSINESS_MARKERS = [
  'cuenta de empresa',
  'cuenta comercial',
  'business account',
  'official business account',
  'cuenta oficial',
  'empresa verificada',
  'negocio',
  'business',
]

export type DrawerKind = 'contact' | 'group' | 'business' | 'unknown'

export type DrawerInspection = {
  kind: DrawerKind
  phone: string | null
  about: string | null
  email: string | null
  website: string | null
  description: string | null
  participantCount: number | null
  participantsPreview: string | null
  isVerified: boolean
  isBusiness: boolean
}

/** Successful phone lookups keyed by chat identity (name or raw phone label). */
const phoneCacheByChatKey = new Map<string, string>()

/** Chats where we already tried the drawer (or know there is no phone). */
const phoneUnavailableKeys = new Set<string>()

export function cachedPhoneForChat(chatKey: string): string | null {
  return phoneCacheByChatKey.get(chatKey) ?? null
}

export function rememberPhoneForChat(chatKey: string, phone: string): void {
  phoneCacheByChatKey.set(chatKey, phone)
  phoneUnavailableKeys.delete(chatKey)
}

export function markPhoneUnavailable(chatKey: string): void {
  phoneUnavailableKeys.add(chatKey)
}

export function isPhoneUnavailable(chatKey: string): boolean {
  return phoneUnavailableKeys.has(chatKey)
}

function firstLine(value: string): string {
  return value.split(/\r?\n/)[0]?.trim() ?? ''
}

function matchesHeading(text: string, headings: string[]): boolean {
  const t = text.trim().toLowerCase()
  return headings.some((h) => t === h || t.startsWith(h))
}

function findHeadingInTree(
  root: ParentNode,
  headings: string[],
): HTMLElement | null {
  for (const el of root.querySelectorAll<HTMLElement>(
    'header span, header div, h1, h2, span, div',
  )) {
    const text = firstLine(el.textContent ?? '')
    if (!text || text.length > 48) continue
    if (matchesHeading(text, headings)) return el
  }
  return null
}

function textLooksBusiness(text: string): boolean {
  const t = text.toLowerCase()
  return BUSINESS_MARKERS.some((m) => t.includes(m))
}

/**
 * Locate WhatsApp's right-hand info drawer when the user has opened it.
 */
export function findInfoDrawer(): HTMLElement | null {
  const byTestId =
    document.querySelector<HTMLElement>('[data-testid="contact-info-drawer"]') ??
    document.querySelector<HTMLElement>('[data-testid="drawer-right"]') ??
    document.querySelector<HTMLElement>('[data-testid="drawer-right-body"]')
  if (byTestId) return byTestId

  for (const headings of [GROUP_DRAWER_HEADINGS, CONTACT_DRAWER_HEADINGS]) {
    for (const el of document.querySelectorAll<HTMLElement>(
      'header span, header div, h1, h2, span, div',
    )) {
      const text = firstLine(el.textContent ?? '')
      if (!text || text.length > 48) continue
      if (!matchesHeading(text, headings)) continue
      const panel =
        el.closest<HTMLElement>('header')?.parentElement ??
        el.closest<HTMLElement>('section, aside, [role="dialog"]')
      if (panel) return panel
    }
  }

  return null
}

function phoneFromElementTree(root: ParentNode): string | null {
  for (const a of root.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]')) {
    const href = a.getAttribute('href')?.replace(/^tel:/i, '').trim()
    if (href && looksLikePhone(href)) {
      return formatPhone(normalizePhone(href)!)
    }
  }

  for (const el of root.querySelectorAll<HTMLElement>('[title]')) {
    const title = el.getAttribute('title')?.trim()
    if (title && looksLikePhone(title)) {
      return formatPhone(normalizePhone(title)!)
    }
  }

  const candidates = root.querySelectorAll<HTMLElement>(
    'span.selectable-text, span.copyable-text, span[dir="ltr"], span[dir="auto"], div[dir="ltr"], div[dir="auto"], span, div',
  )

  for (const el of candidates) {
    if (el.children.length > 0) continue
    const text = firstLine(el.textContent ?? '')
    if (text && looksLikePhone(text)) {
      return formatPhone(normalizePhone(text)!)
    }
  }

  return null
}

function emailFromElementTree(root: ParentNode): string | null {
  for (const a of root.querySelectorAll<HTMLAnchorElement>('a[href^="mailto:"]')) {
    const href = a.getAttribute('href')?.replace(/^mailto:/i, '').trim()
    if (href && href.includes('@')) return href
  }
  const emailRe = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  for (const el of root.querySelectorAll<HTMLElement>('span, div, a')) {
    if (el.children.length > 0) continue
    const text = firstLine(el.textContent ?? '')
    const m = text.match(emailRe)
    if (m) return m[0]
  }
  return null
}

function websiteFromElementTree(root: ParentNode): string | null {
  for (const a of root.querySelectorAll<HTMLAnchorElement>('a[href^="http"]')) {
    const href = a.getAttribute('href')?.trim()
    if (!href) continue
    if (/whatsapp\.com|facebook\.com|meta\.com/i.test(href)) continue
    return href
  }
  return null
}

function aboutFromElementTree(root: ParentNode): string | null {
  // Common labels near status / about blocks
  const labels = [
    'info',
    'about',
    'estado',
    'información',
    'description',
    'descripción',
  ]
  for (const el of root.querySelectorAll<HTMLElement>('span, div')) {
    const label = firstLine(el.textContent ?? '').toLowerCase()
    if (!labels.includes(label)) continue
    const sibling = el.parentElement?.querySelector(
      'span[dir="auto"], span[dir="ltr"], span.selectable-text, div[dir="auto"]',
    )
    const text = firstLine(sibling?.textContent ?? '')
    if (
      text &&
      text.length > 1 &&
      text.length < 200 &&
      !looksLikePhone(text) &&
      !labels.includes(text.toLowerCase())
    ) {
      return text
    }
  }
  return null
}

function participantsFromGroupDrawer(root: ParentNode): {
  count: number | null
  preview: string | null
} {
  const texts: string[] = []
  for (const el of root.querySelectorAll<HTMLElement>(
    'span[title], span[dir="auto"]',
  )) {
    const title = el.getAttribute('title')?.trim()
    const text = title || firstLine(el.textContent ?? '')
    if (!text || text.length > 60) continue
    if (looksLikePhone(text)) continue
    if (matchesHeading(text, GROUP_DRAWER_HEADINGS)) continue
    if (/^(\d+)\s+(participantes|participants|members)/i.test(text)) {
      const n = Number(text.match(/^(\d+)/)?.[1])
      return { count: Number.isFinite(n) ? n : null, preview: null }
    }
    if (/participantes|participants|members|admin/i.test(text)) continue
    if (el.children.length > 0 && !title) continue
    texts.push(text)
  }

  const unique = [...new Set(texts)].slice(0, 8)
  const countMatch = root.textContent?.match(
    /(\d+)\s+(participantes|participants|members)/i,
  )
  const count = countMatch ? Number(countMatch[1]) : unique.length || null

  return {
    count: count && count > 0 ? count : null,
    preview: unique.length ? unique.join(', ') : null,
  }
}

function drawerHasVerified(root: ParentNode): boolean {
  if (
    root.querySelector(
      '[data-icon*="verified"], [data-testid*="verified"], [aria-label*="verific"]',
    )
  ) {
    return true
  }
  const blob = (root.textContent ?? '').toLowerCase()
  return /verificad|verified|official business/.test(blob)
}

function drawerLooksBusiness(root: ParentNode): boolean {
  if (
    root.querySelector(
      '[data-testid*="business"], [data-icon*="business"], [aria-label*="business"], [aria-label*="empresa"]',
    )
  ) {
    return true
  }
  return textLooksBusiness(root.textContent ?? '')
}

/**
 * Inspect the open drawer: group / contact / business and extra fields.
 * Never returns a phone for group-info panels.
 */
export function inspectInfoDrawer(): DrawerInspection | null {
  const drawer = findInfoDrawer()
  if (!drawer) return null

  const isVerified = drawerHasVerified(drawer)
  const isBusiness = drawerLooksBusiness(drawer)

  if (findHeadingInTree(drawer, GROUP_DRAWER_HEADINGS)) {
    const participants = participantsFromGroupDrawer(drawer)
    return {
      kind: 'group',
      phone: null,
      about: aboutFromElementTree(drawer),
      email: null,
      website: null,
      description: null,
      participantCount: participants.count,
      participantsPreview: participants.preview,
      isVerified,
      isBusiness: false,
    }
  }

  if (
    findHeadingInTree(drawer, CONTACT_DRAWER_HEADINGS) ||
    isBusiness
  ) {
    const kind: DrawerKind = isBusiness ? 'business' : 'contact'
    return {
      kind,
      phone: phoneFromElementTree(drawer),
      about: aboutFromElementTree(drawer),
      email: emailFromElementTree(drawer),
      website: websiteFromElementTree(drawer),
      description: aboutFromElementTree(drawer),
      participantCount: null,
      participantsPreview: null,
      isVerified,
      isBusiness,
    }
  }

  return {
    kind: 'unknown',
    phone: null,
    about: null,
    email: null,
    website: null,
    description: null,
    participantCount: null,
    participantsPreview: null,
    isVerified,
    isBusiness,
  }
}

export function phoneFromContactDrawer(): string | null {
  const info = inspectInfoDrawer()
  if (!info || (info.kind !== 'contact' && info.kind !== 'business')) {
    return null
  }
  return info.phone
}
