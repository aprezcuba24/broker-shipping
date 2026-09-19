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

  console.info('[Broker WA POC] sidebar host mounted')

  const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' })

  shadow.replaceChildren()

  const styleEl = document.createElement('style')
  styleEl.textContent = styles
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
