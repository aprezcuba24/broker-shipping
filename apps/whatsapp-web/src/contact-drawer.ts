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

export type DrawerKind = 'contact' | 'group' | 'unknown'

export type DrawerInspection = {
  kind: DrawerKind
  phone: string | null
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

/**
 * Inspect the open drawer: group vs contact, and phone only for contact drawers.
 * Never returns a phone for group-info panels (avoids picking a member's number).
 */
export function inspectInfoDrawer(): DrawerInspection | null {
  const drawer = findInfoDrawer()
  if (!drawer) return null

  if (findHeadingInTree(drawer, GROUP_DRAWER_HEADINGS)) {
    return { kind: 'group', phone: null }
  }

  if (findHeadingInTree(drawer, CONTACT_DRAWER_HEADINGS)) {
    return { kind: 'contact', phone: phoneFromElementTree(drawer) }
  }

  // Unknown drawer — do not scrape phones (could be a member profile inside a group).
  return { kind: 'unknown', phone: null }
}

/** @deprecated use inspectInfoDrawer — kept for call sites that only need a phone. */
export function phoneFromContactDrawer(): string | null {
  const info = inspectInfoDrawer()
  if (!info || info.kind !== 'contact') return null
  return info.phone
}
