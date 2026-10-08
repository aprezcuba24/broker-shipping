export type SellerOrganization = {
  id: string
  name: string
}

export type SessionUser = {
  id: string
  name: string
  email: string
  phone: string | null
}

export type ExtensionSessionLoggedOut = {
  status: 'loggedOut'
}

export type ExtensionSessionAuthenticated = {
  status: 'needsOrgSelection' | 'noSellerOrg' | 'ready'
  accessToken: string
  user: SessionUser
  organizations: SellerOrganization[]
  organizationId: string | null
}

export type ExtensionSession = ExtensionSessionLoggedOut | ExtensionSessionAuthenticated

/** Snapshot safe to send to content scripts / popup UI (no token). */
export type SessionPublic =
  | { status: 'loggedOut' }
  | {
      status: 'needsOrgSelection' | 'noSellerOrg' | 'ready'
      user: SessionUser
      organizations: SellerOrganization[]
      organizationId: string | null
    }

export type SessionAuthMessage =
  | { type: 'LOGIN'; email: string; password: string }
  | { type: 'LOGOUT' }
  | { type: 'GET_SESSION' }
  | { type: 'SELECT_ORG'; organizationId: string }
  | {
      type: 'SHARE_SESSION'
      accessToken: string
      organizationId?: string | null
    }

/**
 * Tag used by the window.postMessage bridge so the extension only picks up
 * messages from this app (and so the seller page only answers its peers).
 */
export const EXTENSION_BRIDGE_SOURCE = 'vendelo360-extension'

export type ExtensionBridgeRequest = {
  source: typeof EXTENSION_BRIDGE_SOURCE
  type: 'REQUEST_SESSION'
}

export type ExtensionBridgeShare = {
  source: typeof EXTENSION_BRIDGE_SOURCE
  type: 'SHARE_SESSION'
  accessToken: string
  organizationId?: string | null
}

export type ExtensionBridgeDenied = {
  source: typeof EXTENSION_BRIDGE_SOURCE
  type: 'SHARE_DENIED'
}

export type ExtensionBridgeMessage =
  | ExtensionBridgeRequest
  | ExtensionBridgeShare
  | ExtensionBridgeDenied

export type SessionResponse = { ok: true; session: SessionPublic } | { ok: false; error: string }

export type ReadySession =
  | { ok: true; accessToken: string; organizationId: string }
  | { ok: false; error: string }
