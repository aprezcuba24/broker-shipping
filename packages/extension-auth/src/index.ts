export { API_BASE_URL, apiRequest, parseError } from './http'
export type { ApiRequestOptions } from './http'

export { fetchMe, fetchSellerOrganizations, loginRequest } from './auth-api'

export { buildAuthenticatedSession } from './session'

export { clearSession, readSession, toSessionPublic, writeSession } from './storage'

export { SESSION_STORAGE_KEY, SELLER_APP_URL } from './constants'

export {
  asExtensionBridgeMessage,
  dispatchBridgeShare,
  dispatchSessionAuthMessage,
  handleGetSession,
  handleLogin,
  handleLogout,
  handleSelectOrg,
  handleShareSession,
  isSessionAuthMessage,
  maybeClearSessionOnAuthError,
  requestSellerShare,
  requireReadySession,
  validateStoredSession,
} from './handlers'

export { EXTENSION_BRIDGE_SOURCE } from './types'

export type {
  ExtensionBridgeDenied,
  ExtensionBridgeMessage,
  ExtensionBridgeRequest,
  ExtensionBridgeShare,
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
