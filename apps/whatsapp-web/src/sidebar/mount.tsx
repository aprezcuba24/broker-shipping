import { createRoot, type Root } from 'react-dom/client'
import type { DetectedChat } from '../detect-chat'
import { SIDEBAR_HOST_ID, SIDEBAR_WIDTH_PX } from '../constants'
import { syncSidebarChrome } from '../layout'
import { App } from './App'
import styles from './styles.css?inline'

export type SidebarHandle = {
  update: (chat: DetectedChat) => void
  unmount: () => void
}

/** Build @font-face rules using extension URLs (Shadow CSS cannot resolve relative font paths). */
function fontFaceCss(): string {
  try {
    if (typeof chrome === 'undefined' || !chrome.runtime?.getURL) return ''
    const manrope400 = chrome.runtime.getURL('fonts/manrope-latin-400-normal.woff2')
    const manrope700 = chrome.runtime.getURL('fonts/manrope-latin-700-normal.woff2')
    const manrope800 = chrome.runtime.getURL('fonts/manrope-latin-800-normal.woff2')
    const inter400 = chrome.runtime.getURL('fonts/inter-latin-400-normal.woff2')
    const inter500 = chrome.runtime.getURL('fonts/inter-latin-500-normal.woff2')
    const inter600 = chrome.runtime.getURL('fonts/inter-latin-600-normal.woff2')
    return `
@font-face {
  font-family: 'Manrope';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url('${manrope400}') format('woff2');
}
@font-face {
  font-family: 'Manrope';
  font-style: normal;
  font-display: swap;
  font-weight: 700;
  src: url('${manrope700}') format('woff2');
}
@font-face {
  font-family: 'Manrope';
  font-style: normal;
  font-display: swap;
  font-weight: 800;
  src: url('${manrope800}') format('woff2');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url('${inter400}') format('woff2');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-display: swap;
  font-weight: 500;
  src: url('${inter500}') format('woff2');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-display: swap;
  font-weight: 600;
  src: url('${inter600}') format('woff2');
}
`
  } catch {
    return ''
  }
}

/**
 * Creates a fixed host on the right edge, attaches an open Shadow DOM,
 * injects scoped CSS, and mounts the React tree inside.
 */
export function mountSidebar(initialChat: DetectedChat): SidebarHandle {
  let host = document.getElementById(SIDEBAR_HOST_ID)
  if (!host) {
    host = document.createElement('div')
    host.id = SIDEBAR_HOST_ID
    document.documentElement.appendChild(host)
  }

  // Default open sizing; App syncs open/collapsed on mount.
  Object.assign(host.style, {
    position: 'fixed',
    top: '0',
    right: '0',
    width: `${SIDEBAR_WIDTH_PX}px`,
    height: '100vh',
    zIndex: '2147483000',
    pointerEvents: 'auto',
  } satisfies Partial<CSSStyleDeclaration>)
  syncSidebarChrome(true)

  console.info('[Vendelo360] sidebar host mounted')

  const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' })

  shadow.replaceChildren()

  const styleEl = document.createElement('style')
  styleEl.textContent = fontFaceCss() + styles
  shadow.appendChild(styleEl)

  const mountPoint = document.createElement('div')
  mountPoint.style.height = '100%'
  shadow.appendChild(mountPoint)

  let currentChat = initialChat
  const root: Root = createRoot(mountPoint)

  const render = (chat: DetectedChat) => {
    currentChat = chat
    root.render(<App chat={currentChat} />)
  }

  render(initialChat)

  return {
    update: (chat) => render(chat),
    unmount: () => {
      root.unmount()
      host?.remove()
    },
  }
}
