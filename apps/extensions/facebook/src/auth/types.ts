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

/** Product queued for posting, with editable caption snapshot. */
export type QueuedProduct = {
  product: ProductSummary
  caption: string
}

/** Per-tab publish session stored when Comenzar opens group tabs. */
export type TabPublishSession = {
  tabId: number
  groupName: string
  groupUrl: string
  products: QueuedProduct[]
  phone: string
}

export type OpenGroupsPayload = {
  groups: FacebookGroup[]
  products: QueuedProduct[]
  phone: string
}

export type FillProductPayload = {
  tabId: number
  productId: string
}

export type OpenGroupsResult =
  | {
      ok: true
      opened: number
      message: string
      tabs: Array<{ tabId: number; groupName: string; groupUrl: string }>
    }
  | { ok: false; error: string }

export type ExtensionMessage =
  | SessionAuthMessage
  | { type: 'OPEN_AUTH' }
  | { type: 'SEARCH_PRODUCTS'; query: string }
  | { type: 'GET_GROUPS' }
  | { type: 'OPEN_GROUPS'; payload: OpenGroupsPayload }
  | { type: 'GET_TAB_SESSION' }
  | { type: 'LEAVE_PUBLISH' }
  | { type: 'FILL_PRODUCT'; payload: FillProductPayload }
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
  | OpenGroupsResult
  | { ok: true; tabSession: TabPublishSession | null }
  | { ok: true; filled: boolean; imageAttached: boolean; dialogVisible?: boolean }
  | { ok: false; error: string }
