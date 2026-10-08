/**
 * seller-bridge.ts
 *
 * Content script that runs on the seller page origin. Three roles:
 *   1. Forward START_PUBLISH from the seller page to the extension background
 *      (publish flow, source = "vendelo360-facebook"). Posts the result back
 *      to the seller page.
 *   2. Forward SHARE_SESSION / SHARE_DENIED from the seller page to the
 *      extension background (session handoff, source = "vendelo360-extension").
 *   3. Re-broadcast REQUEST_SESSION from the extension background to the
 *      seller page (via window.postMessage). The seller page answers with
 *      SHARE_SESSION, which goes through role #2.
 *
 * No UI, no sidebar mounting.
 */

import { asExtensionBridgeMessage, EXTENSION_BRIDGE_SOURCE } from '@broker/extension-auth'

const START_PUBLISH_SOURCE = 'vendelo360-facebook'
const SESSION_SOURCE = EXTENSION_BRIDGE_SOURCE
const START_PUBLISH_REQUEST = 'START_PUBLISH'
const START_PUBLISH_RESPONSE = 'START_PUBLISH_RESPONSE'

interface PublishMessage {
  source: typeof START_PUBLISH_SOURCE
  type: typeof START_PUBLISH_REQUEST
  adsMessages: unknown
  groups: unknown
}

interface PublishResponse {
  source: typeof START_PUBLISH_SOURCE
  type: typeof START_PUBLISH_RESPONSE
  ok: boolean
  error?: string
}

function isPublishMessage(data: unknown): data is PublishMessage {
  if (!data || typeof data !== 'object') return false
  const candidate = data as Partial<PublishMessage>
  return candidate.source === START_PUBLISH_SOURCE && candidate.type === START_PUBLISH_REQUEST
}

// 1 + 2. Seller page → background.
window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin) return
  const data = event.data

  if (isPublishMessage(data)) {
    chrome.runtime.sendMessage(
      {
        type: START_PUBLISH_REQUEST,
        adsMessages: data.adsMessages,
        groups: data.groups,
      },
      (response) => {
        const bridgeResponse: PublishResponse = {
          source: START_PUBLISH_SOURCE,
          type: START_PUBLISH_RESPONSE,
          ok: response?.ok ?? false,
          error: response?.error,
        }
        window.postMessage(bridgeResponse, window.location.origin)
      },
    )
    return
  }

  const sessionMessage = asExtensionBridgeMessage(data)
  if (
    sessionMessage &&
    (sessionMessage.type === 'SHARE_SESSION' || sessionMessage.type === 'SHARE_DENIED')
  ) {
    void chrome.runtime.sendMessage(sessionMessage)
  }
})

// 3. Background → seller page.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== 'object') return
  const request = message as { type?: string; source?: string }
  if (request.type !== 'REQUEST_SESSION') return

  window.postMessage({ source: SESSION_SOURCE, type: 'REQUEST_SESSION' }, window.location.origin)
  sendResponse({ ok: true })
  return true
})
