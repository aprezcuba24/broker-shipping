/**
 * seller-bridge.ts
 * 
 * Content script that runs on the seller page origin.
 * Receives postMessage from the seller page and forwards to extension background.
 * No UI, no sidebar mounting.
 */

const MESSAGE_SOURCE = 'vendelo360-facebook'

interface BridgeMessage {
  source: string
  type: string
  adsMessages?: unknown
  groups?: unknown
}

interface BridgeResponse {
  source: string
  type: string
  ok: boolean
  error?: string
}

// Listen for messages from the seller page
window.addEventListener('message', (event) => {
  // Only accept messages from the same origin (seller page)
  if (event.origin !== window.location.origin) {
    return
  }

  const message = event.data as BridgeMessage
  
  // Validate message structure
  if (!message || typeof message !== 'object') {
    return
  }

  // Only process messages with our source identifier
  if (message.source !== MESSAGE_SOURCE) {
    return
  }

  // Only handle START_PUBLISH messages
  if (message.type !== 'START_PUBLISH') {
    return
  }

  // Forward to background script (internal runtime.sendMessage, no extension ID needed)
  chrome.runtime.sendMessage(
    {
      type: 'START_PUBLISH',
      adsMessages: message.adsMessages,
      groups: message.groups,
    },
    (response) => {
      // Send response back to seller page via postMessage
      const bridgeResponse: BridgeResponse = {
        source: MESSAGE_SOURCE,
        type: 'START_PUBLISH_RESPONSE',
        ok: response?.ok ?? false,
        error: response?.error,
      }
      
      window.postMessage(bridgeResponse, window.location.origin)
    }
  )
})
