import type { LucideIcon } from 'lucide-react'

export type SharePayload = {
  url: string
  text?: string
}

export type ShareChannel = {
  id: string
  label: string
  icon: LucideIcon
  /** Open a share URL in a new tab (e.g. WhatsApp, Twitter). */
  getHref?: (payload: SharePayload) => string
  /** Custom action (e.g. copy to clipboard). Prefer over getHref when both would apply. */
  onShare?: (payload: SharePayload) => void | Promise<void>
}
