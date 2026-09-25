import type { CustomerLookup } from '../services/types'
import type {
  BlacklistReason,
  PhoneBlacklistStatus,
} from '../services/phone-blacklist'

export type SellerOrganization = {
  id: string
  name: string
}

export type SessionUser = {
  id: string
  name: string
  email: string
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

export type ExtensionMessage =
  | { type: 'LOGIN'; email: string; password: string }
  | { type: 'LOGOUT' }
  | { type: 'GET_SESSION' }
  | { type: 'SELECT_ORG'; organizationId: string }
  | { type: 'OPEN_AUTH' }
  | { type: 'FOCUS_WHATSAPP' }
  | { type: 'LOOKUP_CUSTOMER'; phone: string }
  | { type: 'GET_BLACKLIST_STATUS'; phone: string }
  | {
      type: 'ADD_TO_BLACKLIST'
      phone: string
      reason: BlacklistReason
      note?: string
    }
  | { type: 'REMOVE_FROM_BLACKLIST'; phone: string }

export type ExtensionResponse =
  | { ok: true; session: SessionPublic }
  | { ok: true; lookup: CustomerLookup }
  | { ok: true; blacklist: PhoneBlacklistStatus }
  | { ok: false; error: string }

export type SessionResponse =
  | { ok: true; session: SessionPublic }
  | { ok: false; error: string }

export type LookupResponse =
  | { ok: true; lookup: CustomerLookup }
  | { ok: false; error: string }

export type BlacklistResponse =
  | { ok: true; blacklist: PhoneBlacklistStatus }
  | { ok: false; error: string }
