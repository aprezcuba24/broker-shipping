import { mountSidebar } from './sidebar/mount'
import { SIDEBAR_HOST_ID } from './constants'
import { syncSidebarChrome } from './layout'

type FillMessage = {
  type: 'FILL_COMPOSER'
  text: string
  html: string
  imageBase64: string | null
  imageMime: string | null
}

type FillResult = {
  ok: true
  filled: boolean
  imageAttached: boolean
  dialogVisible: boolean
}

const BANNER_ID = 'vendelo-fb-banner'

function showBanner(message: string, tone: 'info' | 'warn' = 'info'): void {
  document.getElementById(BANNER_ID)?.remove()
  const el = document.createElement('div')
  el.id = BANNER_ID
  el.setAttribute('role', 'status')
  el.textContent = message
  Object.assign(el.style, {
    position: 'fixed',
    top: '12px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '2147483647',
    maxWidth: 'min(520px, 92vw)',
    padding: '12px 16px',
    borderRadius: '10px',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '14px',
    lineHeight: '1.4',
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    background: tone === 'warn' ? '#5c2818' : '#1e3a5f',
    color: '#fff',
  })
  document.documentElement.appendChild(el)
}

function isVisible(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect()
  if (rect.width < 8 || rect.height < 8) return false
  const style = window.getComputedStyle(el)
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    style.opacity === '0'
  ) {
    return false
  }
  return true
}

/**
 * The create-post modal (not the inline feed strip / comments).
 */
function findCreatePostDialog(): HTMLElement | null {
  const dialogs = document.querySelectorAll('div[role="dialog"]')
  for (const node of dialogs) {
    if (!(node instanceof HTMLElement) || !isVisible(node)) continue
    const hasEditable = node.querySelector('[contenteditable="true"]')
    if (!hasEditable) continue
    const label = (
      node.getAttribute('aria-label') ||
      node.innerText ||
      ''
    ).toLowerCase()
    if (
      label.includes('crear publicación') ||
      label.includes('create post') ||
      label.includes('publicar') ||
      label.includes('post') ||
      label.includes('escribe') ||
      label.includes('write')
    ) {
      return node
    }
    // Large centered dialog with a textbox is almost always the composer.
    const rect = node.getBoundingClientRect()
    if (rect.width >= 320 && rect.height >= 200) return node
  }
  return null
}

function findComposerBoxInDialog(dialog: HTMLElement): HTMLElement | null {
  const textboxes = dialog.querySelectorAll(
    '[contenteditable="true"][role="textbox"]',
  )
  let best: HTMLElement | null = null
  for (const node of textboxes) {
    if (!(node instanceof HTMLElement) || !isVisible(node)) continue
    if (!best || best.contains(node)) best = node
  }
  if (best) return best

  const any = dialog.querySelector('[contenteditable="true"]')
  return any instanceof HTMLElement && isVisible(any) ? any : null
}

function findComposerTrigger(): HTMLElement | null {
  const candidates: HTMLElement[] = []
  const selectors = [
    '[aria-label*="Escribe algo" i]',
    '[aria-label*="Write something" i]',
    '[aria-label*="Create a public post" i]',
    '[aria-label*="Crear una publicación" i]',
    '[role="button"]',
  ]
  for (const sel of selectors) {
    for (const node of document.querySelectorAll(sel)) {
      if (!(node instanceof HTMLElement) || !isVisible(node)) continue
      const label = (
        node.getAttribute('aria-label') ||
        node.textContent ||
        ''
      ).toLowerCase()
      if (
        label.includes('escribe algo') ||
        label.includes('write something') ||
        label.includes('crear una publicación') ||
        label.includes('create a public post') ||
        label.includes("what's on your mind") ||
        label.includes('qué estás pensando')
      ) {
        candidates.push(node)
      }
    }
  }
  // Prefer triggers near the top of the feed (create post), not comments.
  candidates.sort(
    (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top,
  )
  return candidates[0] ?? null
}

function readComposerPlain(box: HTMLElement): string {
  return (box.innerText || box.textContent || '').replace(/\u00a0/g, ' ').trim()
}

function countMarker(content: string, marker: string): number {
  if (!marker) return 0
  let n = 0
  let from = 0
  while (true) {
    const i = content.indexOf(marker, from)
    if (i < 0) return n
    n += 1
    from = i + marker.length
  }
}

/** True when our post appears exactly once. */
function composerLooksFilled(box: HTMLElement, text: string): boolean {
  const content = readComposerPlain(box)
  if (!content) return false
  if (countMarker(content, 'wa.me') !== 1) return false
  if (
    text.includes('Contactar por Whatsapp') &&
    countMarker(content, 'Contactar por Whatsapp') !== 1
  ) {
    return false
  }
  return true
}

function composerHasOurPost(box: HTMLElement): boolean {
  return countMarker(readComposerPlain(box), 'wa.me') >= 1
}

function selectAllIn(box: HTMLElement): void {
  box.focus()
  try {
    document.execCommand('selectAll', false)
  } catch {
    const selection = window.getSelection()
    if (!selection) return
    const range = document.createRange()
    range.selectNodeContents(box)
    selection.removeAllRanges()
    selection.addRange(range)
  }
}

/**
 * Lexical (Facebook) duplicates text if you use execCommand('insertText')
 * and/or synthetic InputEvent with data — native insert + beforeinput both fire.
 * Paste replaces the current selection in one Lexical update. Do that only.
 * Include text/html so the price can stay bold and wa.me stays a real link.
 */
function pasteReplacingSelection(
  box: HTMLElement,
  text: string,
  html?: string,
): void {
  box.focus()
  selectAllIn(box)
  const dt = new DataTransfer()
  dt.setData('text/plain', text)
  if (html) dt.setData('text/html', html)
  box.dispatchEvent(
    new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: dt,
    }),
  )
}

async function waitFrames(n = 2): Promise<void> {
  for (let i = 0; i < n; i++) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
}

/** One paste replace. At most one recovery paste if still empty. Never stack inserts. */
async function setComposerText(
  box: HTMLElement,
  text: string,
  html?: string,
): Promise<boolean> {
  pasteReplacingSelection(box, text, html)
  await waitFrames(2)
  if (composerLooksFilled(box, text)) return true

  if (!composerHasOurPost(box)) {
    pasteReplacingSelection(box, text, html)
    await waitFrames(2)
  }
  return composerLooksFilled(box, text)
}

function findFileInput(dialog: HTMLElement): HTMLInputElement | null {
  const inputs = dialog.querySelectorAll('input[type="file"]')
  for (const input of inputs) {
    if (input instanceof HTMLInputElement) return input
  }
  return null
}

async function attachImage(
  dialog: HTMLElement,
  base64: string,
  mime: string,
): Promise<boolean> {
  const input = findFileInput(dialog)
  if (!input) return false

  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: mime })
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg'
  const file = new File([blob], `product.${ext}`, { type: mime })
  const transfer = new DataTransfer()
  transfer.items.add(file)
  input.files = transfer.files
  input.dispatchEvent(new Event('change', { bubbles: true }))
  input.dispatchEvent(new Event('input', { bubbles: true }))
  return true
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

/** Hide our sidebar so Facebook's centered modal is not covered. */
function hideSidebarForModal(): void {
  const host = document.getElementById(SIDEBAR_HOST_ID)
  if (host) host.style.display = 'none'
  syncSidebarChrome(false)
}

function restoreSidebar(): void {
  const host = document.getElementById(SIDEBAR_HOST_ID)
  if (host) host.style.display = ''
  syncSidebarChrome(true)
}

async function openCreatePostDialog(): Promise<HTMLElement | null> {
  hideSidebarForModal()

  let dialog = findCreatePostDialog()
  if (dialog) return dialog

  const trigger = findComposerTrigger()
  if (!trigger) return null

  trigger.scrollIntoView({ block: 'center', behavior: 'instant' })
  await sleep(200)
  trigger.click()

  for (let i = 0; i < 15; i++) {
    await sleep(400)
    dialog = findCreatePostDialog()
    if (dialog) {
      dialog.scrollIntoView({ block: 'center', behavior: 'instant' })
      return dialog
    }
  }
  return null
}

/** Prevent overlapping fills (e.g. multiple content-script copies after extension reload). */
let fillInFlight: Promise<FillResult> | null = null

async function fillComposer(message: FillMessage): Promise<FillResult> {
  if (fillInFlight) return fillInFlight

  fillInFlight = (async () => {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([message.text], { type: 'text/plain' }),
          ...(message.html
            ? {
                'text/html': new Blob([message.html], { type: 'text/html' }),
              }
            : {}),
        }),
      ])
    } catch {
      await navigator.clipboard.writeText(message.text).catch(() => undefined)
    }

    try {
      const dialog = await openCreatePostDialog()
      if (!dialog) {
        showBanner(
          'No se abrió el diálogo «Crear publicación». Ábrelo a mano y pega el texto (Ctrl+V).',
          'warn',
        )
        restoreSidebar()
        return { ok: true, filled: false, imageAttached: false, dialogVisible: false }
      }

      const box = findComposerBoxInDialog(dialog)
      if (!box) {
        showBanner(
          'Se abrió el diálogo pero no hay cuadro de texto. Pega con Ctrl+V.',
          'warn',
        )
        return { ok: true, filled: false, imageAttached: false, dialogVisible: true }
      }

      // Attach image first when possible — Facebook sometimes resets caption on photo add.
      let imageAttached = false
      if (message.imageBase64 && message.imageMime) {
        imageAttached = await attachImage(dialog, message.imageBase64, message.imageMime)
        await sleep(600)
      }

      const dialogNow = findCreatePostDialog() ?? dialog
      const boxNow = findComposerBoxInDialog(dialogNow) ?? box

      // Exactly one write path (paste-replace). Do not stack insertText / InputEvent.
      let filled = await setComposerText(boxNow, message.text, message.html)

      const dialogStillOpen = Boolean(findCreatePostDialog())

      if (filled && dialogStillOpen) {
        showBanner(
          imageAttached
            ? 'Listo: mira el diálogo «Crear publicación» en el centro y pulsa Publicar.'
            : message.imageBase64
              ? 'Texto listo en el diálogo. Adjunta la foto a mano y pulsa Publicar.'
              : 'Texto listo en el diálogo. Revisa y pulsa Publicar.',
        )
      } else if (filled && !dialogStillOpen) {
        showBanner(
          'El texto se escribió pero el diálogo se cerró. Ábrelo de nuevo y pega con Ctrl+V.',
          'warn',
        )
        filled = false
      } else {
        showBanner(
          'No se pudo escribir el texto. En el diálogo, pega con Ctrl+V y publica.',
          'warn',
        )
      }

      return {
        ok: true,
        filled: filled && dialogStillOpen,
        imageAttached,
        dialogVisible: dialogStillOpen,
      }
    } finally {
      setTimeout(() => restoreSidebar(), 2500)
    }
  })()

  try {
    return await fillInFlight
  } finally {
    fillInFlight = null
  }
}

let booted = false

function boot(): void {
  if (booted) return
  booted = true
  mountSidebar()
  console.info('[Vendelo360 Facebook] ready')
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== 'object' || message.type !== 'FILL_COMPOSER') {
    return false
  }
  void fillComposer(message as FillMessage).then(sendResponse)
  return true
})

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true })
} else {
  boot()
}
