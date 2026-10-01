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

export type PreparePostPayload = {
  groupUrl: string
  groupName: string
  text: string
  html: string
  imageUrl: string | null
}


export type PreparePostResult =
  | { ok: true; filled: boolean; imageAttached: boolean; message: string }
  | { ok: false; error: string }

export type ExtensionMessage =
  | SessionAuthMessage
  | { type: 'OPEN_AUTH' }
  | { type: 'SEARCH_PRODUCTS'; query: string }
  | { type: 'GET_GROUPS' }
  | { type: 'PREPARE_POST'; payload: PreparePostPayload }
  | { type: 'FILL_COMPOSER'; text: string; html: string; imageBase64: string | null; imageMime: string | null }

export type ExtensionResponse =
  | { ok: true; session: SessionPublic }
  | { ok: true; products: ProductSummary[] }
  | { ok: true; groups: FacebookGroup[] }
  | PreparePostResult
  | { ok: true; filled: boolean; imageAttached: boolean }
  | { ok: false; error: string }
