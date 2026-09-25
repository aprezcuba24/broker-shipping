import type {
  ExtensionMessage,
  ExtensionResponse,
  LookupResponse,
  BlacklistResponse,
  SessionPublic,
  SessionResponse,
  UpdateStatusResponse,
} from './types'
import type { BlacklistReason } from '../services/phone-blacklist'

export function sendMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
  return chrome.runtime.sendMessage(message) as Promise<ExtensionResponse>
}

export function isSessionOk(
  response: ExtensionResponse,
): response is Extract<SessionResponse, { ok: true }> {
  return response.ok && 'session' in response
}

export function isLookupOk(
  response: ExtensionResponse,
): response is Extract<LookupResponse, { ok: true }> {
  return response.ok && 'lookup' in response
}

export async function getSessionPublic(): Promise<SessionPublic> {
  const response = await sendMessage({ type: 'GET_SESSION' })
  if (isSessionOk(response)) return response.session
  return { status: 'loggedOut' }
}

export async function lookupCustomer(phone: string): Promise<LookupResponse> {
  const response = await sendMessage({ type: 'LOOKUP_CUSTOMER', phone })
  if (response.ok && 'lookup' in response) return response
  if (!response.ok) return response
  return { ok: false, error: 'Respuesta inválida' }
}

export async function getBlacklistStatus(
  phone: string,
): Promise<BlacklistResponse> {
  const response = await sendMessage({ type: 'GET_BLACKLIST_STATUS', phone })
  if (response.ok && 'blacklist' in response) return response
  if (!response.ok) return response
  return { ok: false, error: 'Respuesta inválida' }
}

export async function addToBlacklist(params: {
  phone: string
  reason: BlacklistReason
  note?: string
}): Promise<BlacklistResponse> {
  const response = await sendMessage({
    type: 'ADD_TO_BLACKLIST',
    phone: params.phone,
    reason: params.reason,
    note: params.note,
  })
  if (response.ok && 'blacklist' in response) return response
  if (!response.ok) return response
  return { ok: false, error: 'Respuesta inválida' }
}

export async function removeFromBlacklist(
  phone: string,
): Promise<BlacklistResponse> {
  const response = await sendMessage({ type: 'REMOVE_FROM_BLACKLIST', phone })
  if (response.ok && 'blacklist' in response) return response
  if (!response.ok) return response
  return { ok: false, error: 'Respuesta inválida' }
}

export async function getUpdateStatus(): Promise<UpdateStatusResponse> {
  const response = await sendMessage({ type: 'GET_UPDATE_STATUS' })
  if (response.ok && 'updateAvailable' in response) return response
  if (!response.ok) return response
  return { ok: false, error: 'Respuesta inválida' }
}

export async function applyUpdate(): Promise<ExtensionResponse> {
  return sendMessage({ type: 'APPLY_UPDATE' })
}
