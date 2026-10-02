import type { CustomerLookup } from '../services/types'
import type {
  BlacklistReason,
  PhoneBlacklistStatus,
} from '../services/phone-blacklist'
import type { SessionAuthMessage, SessionPublic } from '@broker/extension-auth'

export type {
  ExtensionSession,
  ExtensionSessionAuthenticated,
  ExtensionSessionLoggedOut,
  SellerOrganization,
  SessionPublic,
  SessionResponse,
  SessionUser,
} from '@broker/extension-auth'

export type ExtensionMessage =
  | SessionAuthMessage
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
  | { type: 'GET_UPDATE_STATUS' }
  | { type: 'APPLY_UPDATE' }

export type ExtensionResponse =
  | { ok: true; session: SessionPublic }
  | { ok: true; lookup: CustomerLookup }
  | { ok: true; blacklist: PhoneBlacklistStatus }
  | { ok: true; updateAvailable: boolean }
  | { ok: false; error: string }

export type LookupResponse =
  | { ok: true; lookup: CustomerLookup }
  | { ok: false; error: string }

export type BlacklistResponse =
  | { ok: true; blacklist: PhoneBlacklistStatus }
  | { ok: false; error: string }

export type UpdateStatusResponse =
  | { ok: true; updateAvailable: boolean }
  | { ok: false; error: string }
