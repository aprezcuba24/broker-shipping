import type { SessionAuthMessage, SessionPublic } from '@broker/extension-auth'
import type { PublishQueueGroup } from '../publish-queue'

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
  | {
      type: 'START_PUBLISH'
      adsMessages: AdsMessageSummary[]
      groups: PublishQueueGroup[]
    }
  | { type: 'CLEAR_PUBLISH_QUEUE' }

export type ExtensionResponse =
  | { ok: true; session: SessionPublic }
  | { ok: true; adsMessages: AdsMessageSummary[] }
  | { ok: true }
  | { ok: false; error: string }
