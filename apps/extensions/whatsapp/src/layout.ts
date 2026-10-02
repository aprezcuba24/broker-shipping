import { SIDEBAR_HOST_ID, SIDEBAR_WIDTH_PX } from './constants'

const STYLE_ID = 'vendelo-wa-layout-style'

/**
 * Reserves horizontal space on the right so WhatsApp's main UI is not
 * covered by our fixed sidebar.
 */
export function applySidebarLayout(): void {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.documentElement.appendChild(style)
  }

  style.textContent = `
    .app-wrapper-web > div {
      max-width: calc(100vw - ${SIDEBAR_WIDTH_PX}px) !important;
      width: calc(100vw - ${SIDEBAR_WIDTH_PX}px) !important;
    }
    #app {
      box-sizing: border-box;
      padding-right: ${SIDEBAR_WIDTH_PX}px;
    }
  `
}

export function clearSidebarLayout(): void {
  document.getElementById(STYLE_ID)?.remove()
}

/** Resize the extension host and WA shell for open vs collapsed modes. */
export function syncSidebarChrome(open: boolean): void {
  const host = document.getElementById(SIDEBAR_HOST_ID)
  if (!host) return

  if (open) {
    Object.assign(host.style, {
      position: 'fixed',
      top: '0',
      right: '0',
      width: `${SIDEBAR_WIDTH_PX}px`,
      height: '100vh',
      zIndex: '2147483000',
      pointerEvents: 'auto',
    } satisfies Partial<CSSStyleDeclaration>)
    applySidebarLayout()
  } else {
    Object.assign(host.style, {
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: 'auto',
      height: 'auto',
      zIndex: '2147483000',
      pointerEvents: 'auto',
    } satisfies Partial<CSSStyleDeclaration>)
    clearSidebarLayout()
  }
}
