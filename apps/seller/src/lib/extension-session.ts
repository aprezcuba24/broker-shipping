/**
 * Bridge between the seller web app and the browser extensions.
 *
 * Mounts a `window.message` listener that answers `REQUEST_SESSION` from any
 * installed extension. The seller must already be authenticated (token in
 * `broker:seller:token`) before it shares a session.
 *
 * Shared through the `vendelo360-extension` *source* namespace. Only
 * same-origin postMessages are accepted; we never trust a stranger frame.
 *
 * Tokens come from the persisted auth storage used by `AuthProvider`. The
 * active organization id is pulled from the persisted super-admin slot when
 * available; for regular seller users there's no persistent slot — the
 * extension derives the active org from its `/users/my-organizations` list.
 */

import { EXTENSION_BRIDGE_SOURCE } from '@broker/extension-auth'
import { createLocalStorageAuthStorage } from '@broker/api'
import { peekActiveOrganizationId } from '@broker/ui'

const SELLER_TOKEN_KEY = 'broker:seller:token'
const authStorage = createLocalStorageAuthStorage(SELLER_TOKEN_KEY)

const SOURCE = EXTENSION_BRIDGE_SOURCE

type BridgeMessage = { source: typeof SOURCE; type: 'REQUEST_SESSION' }

let installed = false

function isBridgeRequest(data: unknown): data is BridgeMessage {
  if (!data || typeof data !== 'object') return false
  const candidate = data as Partial<BridgeMessage>
  return candidate.source === SOURCE && candidate.type === 'REQUEST_SESSION'
}

function postReply(message: unknown): void {
  window.postMessage(message, window.location.origin)
}

function handleMessage(event: MessageEvent): void {
  if (event.origin !== window.location.origin) return
  if (!isBridgeRequest(event.data)) return

  const accessToken = authStorage.getToken()
  const organizationId = peekActiveOrganizationId()
  if (!accessToken) {
    postReply({ source: SOURCE, type: 'SHARE_DENIED' })
    return
  }
  postReply({
    source: SOURCE,
    type: 'SHARE_SESSION',
    accessToken,
    organizationId: organizationId ?? null,
  })
}

/**
 * Install the global postMessage listener. Idempotent.
 * Returns an uninstall function (mostly useful for tests).
 */
export function setupExtensionSessionBridge(): () => void {
  if (installed) return () => undefined
  installed = true
  window.addEventListener('message', handleMessage)
  return () => {
    window.removeEventListener('message', handleMessage)
    installed = false
  }
}
