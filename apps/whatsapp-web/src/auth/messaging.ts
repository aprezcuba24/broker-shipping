import type {
  ExtensionMessage,
  ExtensionResponse,
  LookupResponse,
  SessionPublic,
  SessionResponse,
} from './types'

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
