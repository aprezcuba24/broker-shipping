import { PUBLISH_QUEUE_STORAGE_KEY } from './constants'

export type PublishQueueAdsMessage = {
  id: string
  title: string
  description: string
  code: string
  photo_url: string | null
}

export type PublishQueueGroup = {
  id: string
  name: string
  url: string
}

export type PublishQueue = {
  adsMessages: PublishQueueAdsMessage[]
  groups: PublishQueueGroup[]
  startedAt: number
}

function isAdsMessageSummary(value: unknown): value is PublishQueueAdsMessage {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.description === 'string' &&
    typeof item.code === 'string' &&
    (item.photo_url === null || typeof item.photo_url === 'string')
  )
}

function isPublishQueueGroup(value: unknown): value is PublishQueueGroup {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.url === 'string'
  )
}

export function parsePublishQueue(value: unknown): PublishQueue | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (!Array.isArray(raw.adsMessages) || !Array.isArray(raw.groups)) return null
  if (typeof raw.startedAt !== 'number') return null
  if (!raw.adsMessages.every(isAdsMessageSummary)) return null
  if (!raw.groups.every(isPublishQueueGroup)) return null
  return {
    adsMessages: raw.adsMessages,
    groups: raw.groups,
    startedAt: raw.startedAt,
  }
}

export async function readPublishQueue(): Promise<PublishQueue | null> {
  const stored = await chrome.storage.local.get(PUBLISH_QUEUE_STORAGE_KEY)
  return parsePublishQueue(stored[PUBLISH_QUEUE_STORAGE_KEY])
}

export async function writePublishQueue(queue: PublishQueue): Promise<void> {
  await chrome.storage.local.set({ [PUBLISH_QUEUE_STORAGE_KEY]: queue })
}

export async function clearPublishQueue(): Promise<void> {
  await chrome.storage.local.remove(PUBLISH_QUEUE_STORAGE_KEY)
}
