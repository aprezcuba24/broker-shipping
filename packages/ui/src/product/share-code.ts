import { ShareChannel } from '@broker/api'

export type ProductSharePayload = {
  code: string
  message: string
}

const CHANNEL_PREFIXES = new Set<string>(Object.values(ShareChannel))

export function buildProductShareCode(
  channel: ShareChannel,
  publicCode: string,
): string {
  return `${channel}-${publicCode}`
}

export function buildProductShareMessage(
  channel: ShareChannel,
  publicCode: string,
  productName: string,
): ProductSharePayload {
  const code = buildProductShareCode(channel, publicCode)
  return {
    code,
    message: `Hola, quiero comprar ${productName}.\nCódigo: ${code}`,
  }
}

export function extractPublicCodeFromSearch(term: string): string {
  const trimmed = term.trim()
  if (!trimmed) return trimmed
  const dash = trimmed.indexOf('-')
  if (dash <= 0) return trimmed
  const prefix = trimmed.slice(0, dash).toUpperCase()
  const remainder = trimmed.slice(dash + 1).trim()
  if (CHANNEL_PREFIXES.has(prefix) && remainder) {
    return remainder
  }
  return trimmed
}

export function extractShareChannelFromSearch(term: string): ShareChannel | null {
  const trimmed = term.trim()
  if (!trimmed) return null
  const dash = trimmed.indexOf('-')
  if (dash <= 0) return null
  const prefix = trimmed.slice(0, dash).toUpperCase()
  const remainder = trimmed.slice(dash + 1).trim()
  if (!remainder || !CHANNEL_PREFIXES.has(prefix)) return null
  return prefix as ShareChannel
}

/** Return the original search term when it is a valid share code for the product. */
export function resolveShareCodeForProduct(
  searchTerm: string | null | undefined,
  publicCode: string | null | undefined,
): string | undefined {
  if (!searchTerm || !publicCode) return undefined
  const channel = extractShareChannelFromSearch(searchTerm)
  if (!channel) return undefined
  const code = extractPublicCodeFromSearch(searchTerm)
  if (code.toLowerCase() !== publicCode.toLowerCase()) return undefined
  return searchTerm.trim()
}
