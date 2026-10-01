import type { SessionPublic, SessionResponse } from '@broker/extension-auth'
import type { ExtensionMessage, ExtensionResponse } from './types'

export function sendMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
  return chrome.runtime.sendMessage(message) as Promise<ExtensionResponse>
}

export function isSessionOk(
  response: ExtensionResponse,
): response is Extract<SessionResponse, { ok: true }> {
  return response.ok && 'session' in response
}

export async function getSessionPublic(): Promise<SessionPublic> {
  const response = await sendMessage({ type: 'GET_SESSION' })
  if (isSessionOk(response)) return response.session
  return { status: 'loggedOut' }
}
