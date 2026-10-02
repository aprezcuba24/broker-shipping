import type { SessionAuthMessage, SessionPublic } from '@broker/extension-auth'

export type FacebookGroup = {
  name: string
  url: string
}

export type GroupsConfig = {
  groups: FacebookGroup[]
}

export type ProductSummary = {
  id: string
  name: string
  public_code: string
  description: string | null
  image_url: string | null
  price: { amount: number; currency: string } | null
  sale_price: { amount: number; currency: string } | null
}

export type PreparedTab = {
  tabId: number
  groupName: string
  groupUrl: string
}

export type PreparePostsPayload = {
  text: string
  html: string
  imageUrl: string | null
  groups: FacebookGroup[]
}

export type RetryPostsPayload = {
  text: string
  html: string
  imageUrl: string | null
  tabs: PreparedTab[]
}

export type PreparePostsResult =
  | {
      ok: true
      prepared: number
      failed: number
      message: string
      tabs: PreparedTab[]
    }
  | { ok: false; error: string }

export type ExtensionMessage =
  | SessionAuthMessage
  | { type: 'OPEN_AUTH' }
  | { type: 'SEARCH_PRODUCTS'; query: string }
  | { type: 'GET_GROUPS' }
  | { type: 'PREPARE_POSTS'; payload: PreparePostsPayload }
  | { type: 'RETRY_POSTS'; payload: RetryPostsPayload }
  | {
      type: 'FILL_COMPOSER'
      text: string
      html: string
      imageBase64: string | null
      imageMime: string | null
    }

export type ExtensionResponse =
  | { ok: true; session: SessionPublic }
  | { ok: true; products: ProductSummary[] }
  | { ok: true; groups: FacebookGroup[] }
  | PreparePostsResult
  | { ok: true; filled: boolean; imageAttached: boolean; dialogVisible?: boolean }
  | { ok: false; error: string }
