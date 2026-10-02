export { API_BASE_URL, apiRequest, parseError } from './http'
export type { ApiRequestOptions } from './http'

export {
  fetchMe,
  fetchSellerOrganizations,
  loginRequest,
} from './auth-api'

export { buildAuthenticatedSession } from './session'

export {
  clearSession,
  readSession,
  toSessionPublic,
  writeSession,
} from './storage'

export {
  SESSION_STORAGE_KEY,
  SELLER_APP_URL,
} from './constants'

export {
  dispatchSessionAuthMessage,
  handleGetSession,
  handleLogin,
  handleLogout,
  handleSelectOrg,
  isSessionAuthMessage,
  maybeClearSessionOnAuthError,
  requireReadySession,
  validateStoredSession,
} from './handlers'

export type {
  ExtensionSession,
  ExtensionSessionAuthenticated,
  ExtensionSessionLoggedOut,
  ReadySession,
  SellerOrganization,
  SessionAuthMessage,
  SessionPublic,
  SessionResponse,
  SessionUser,
} from './types'
