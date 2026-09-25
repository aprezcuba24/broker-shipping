/** chrome.storage.local key for the seller extension session. */
export const SESSION_STORAGE_KEY = 'vendelo360:session:v1'

export const SELLER_APP_URL = String(
  import.meta.env.VITE_SELLER_URL || 'http://localhost:5174',
).replace(/\/$/, '')
