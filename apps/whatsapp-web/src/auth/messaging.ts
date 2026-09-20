import type { ExtensionMessage, ExtensionResponse, SessionPublic } from './types'

export function sendMessage(message: ExtensionMessage): Promise<ExtensionResponse> {
  return chrome.runtime.sendMessage(message) as Promise<ExtensionResponse>
}

export async function getSessionPublic(): Promise<SessionPublic> {
  const response = await sendMessage({ type: 'GET_SESSION' })
  if (!response?.ok) {
    return { status: 'loggedOut' }
  }
  return response.session
}
