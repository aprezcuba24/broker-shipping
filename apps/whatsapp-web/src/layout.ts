import { SIDEBAR_WIDTH_PX } from './constants'

const STYLE_ID = 'broker-wa-poc-layout-style'

/**
 * Reserves horizontal space on the right so WhatsApp's main UI is not
 * covered by our fixed sidebar. Falls back gracefully if WA markup changes.
 */
export function applySidebarLayout(): () => void {
  if (document.getElementById(STYLE_ID)) {
    return () => undefined
  }

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    /* Prefer shrinking the main WA shell when present */
    .app-wrapper-web > div {
      max-width: calc(100vw - ${SIDEBAR_WIDTH_PX}px) !important;
      width: calc(100vw - ${SIDEBAR_WIDTH_PX}px) !important;
    }
    /* Fallback: push #app content left if wrapper selector misses */
    #app {
      box-sizing: border-box;
      padding-right: ${SIDEBAR_WIDTH_PX}px;
    }
  `
  document.documentElement.appendChild(style)

  return () => {
    style.remove()
  }
}
