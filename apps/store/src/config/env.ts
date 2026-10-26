export const API_URL = import.meta.env.VITE_API_URL?.trim() || 'http://localhost:8000'

export const SELLER_ORGANIZATION_ID =
  import.meta.env.VITE_SELLER_ORGANIZATION_ID?.trim() ?? ''

export const WHATSAPP_PHONE = import.meta.env.VITE_WHATSAPP_PHONE?.trim() ?? ''

export function isStoreConfigured(): boolean {
  return Boolean(SELLER_ORGANIZATION_ID && WHATSAPP_PHONE)
}
