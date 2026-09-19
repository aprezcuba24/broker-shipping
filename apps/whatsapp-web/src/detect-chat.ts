export type DetectedChat = {
  /** Visible contact/group name from the conversation header. */
  name: string | null
  /** Phone only when the header title itself looks like a number. */
  phone: string | null
}

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
  'haz clic para ver la info del contacto',
  'info. del contacto',
  'contact info',
  'datos del contacto',
  'tú',
  'you',
]

function isUiNoise(value: string): boolean {
  const lower = value.trim().toLowerCase()
  if (!lower) return true
  return UI_NOISE.some((n) => lower === n || lower.startsWith(n))
}

/** Heuristic: title looks like a phone number (not a saved contact name). */
export function looksLikePhone(value: string): boolean {
  const cleaned = value.replace(/[\s\-().]/g, '')
  return /^\+?\d{7,15}$/.test(cleaned)
}

function pickTitle(el: Element): string | null {
  const title = el.getAttribute('title')?.trim()
  if (!title || isUiNoise(title)) return null
  return title
}

/**
 * Reads the currently open conversation from WhatsApp Web's `#main` header.
 * Prefer elements with a `title` attribute; fall back to `dir="auto"` spans.
 */
export function detectCurrentChat(): DetectedChat {
  const main = document.querySelector('#main')
  if (!main) {
    return { name: null, phone: null }
  }

  const header = main.querySelector('header')
  if (!header) {
    return { name: null, phone: null }
  }

  const titled = header.querySelectorAll('span[title], div[title]')
  for (const el of titled) {
    const title = pickTitle(el)
    if (!title) continue
    return {
      name: title,
      phone: looksLikePhone(title) ? title : null,
    }
  }

  const autoSpans = header.querySelectorAll('span[dir="auto"]')
  for (const el of autoSpans) {
    const text = el.textContent?.trim() ?? ''
    if (!text || isUiNoise(text)) continue
    // Skip very long strings (often status / subtitle noise)
    if (text.length > 80) continue
    return {
      name: text,
      phone: looksLikePhone(text) ? text : null,
    }
  }

  return { name: null, phone: null }
}

export type ChatWatcher = {
  stop: () => void
}

/**
 * Observes `#main` / header changes and calls `onChange` when the detected
 * contact name changes. Debounced to avoid thrashing on WA DOM churn.
 */
export function watchCurrentChat(
  onChange: (chat: DetectedChat) => void,
  debounceMs = 100,
): ChatWatcher {
  let lastKey = ''
  let timer: ReturnType<typeof setTimeout> | null = null
  let headerObserver: MutationObserver | null = null

  const emit = () => {
    const chat = detectCurrentChat()
    const key = `${chat.name ?? ''}|${chat.phone ?? ''}`
    if (key === lastKey) return
    lastKey = key
    onChange(chat)
  }

  const schedule = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(emit, debounceMs)
  }

  const attachHeaderObserver = () => {
    headerObserver?.disconnect()
    headerObserver = null
    const header = document.querySelector('#main header')
    if (!header) return
    headerObserver = new MutationObserver(schedule)
    headerObserver.observe(header, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['title'],
    })
  }

  // Watch the whole app tree for #main appearing / disappearing / swapping
  const rootObserver = new MutationObserver(() => {
    attachHeaderObserver()
    schedule()
  })

  const app = document.querySelector('#app') ?? document.body
  rootObserver.observe(app, { childList: true, subtree: true })

  attachHeaderObserver()
  emit()

  return {
    stop: () => {
      if (timer) clearTimeout(timer)
      rootObserver.disconnect()
      headerObserver?.disconnect()
    },
  }
}
