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
  return `${channel}${publicCode}`
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

function splitShareTerm(term: string): [string, string] | null {
  const trimmed = term.trim()
  if (!trimmed) return null

  const dash = trimmed.indexOf('-')
  if (dash > 0) {
    const prefix = trimmed.slice(0, dash).toUpperCase()
    const remainder = trimmed.slice(dash + 1).trim()
    if (CHANNEL_PREFIXES.has(prefix) && remainder) {
      return [prefix, remainder]
    }
  }

  if (trimmed.length > 2) {
    const prefix = trimmed.slice(0, 2).toUpperCase()
    const remainder = trimmed.slice(2).trim()
    if (CHANNEL_PREFIXES.has(prefix) && remainder) {
      return [prefix, remainder]
    }
  }

  return null
}

export function extractPublicCodeFromSearch(term: string): string {
  const trimmed = term.trim()
  if (!trimmed) return trimmed
  const split = splitShareTerm(trimmed)
  if (split) return split[1]
  return trimmed
}

export function extractShareChannelFromSearch(term: string): ShareChannel | null {
  const split = splitShareTerm(term)
  if (!split) return null
  return split[0] as ShareChannel
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
