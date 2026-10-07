import type { SessionAuthMessage, SessionPublic } from '@broker/extension-auth'

export type AdsMessageSummary = {
  id: string
  title: string
  description: string
  code: string
  photo_url: string | null
}

export type ExtensionMessage =
  | SessionAuthMessage
  | { type: 'OPEN_AUTH' }
  | { type: 'LIST_ADS_MESSAGES' }

export type ExtensionResponse =
  | { ok: true; session: SessionPublic }
  | { ok: true; adsMessages: AdsMessageSummary[] }
  | { ok: false; error: string }
