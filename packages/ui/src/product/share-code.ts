import { ShareChannel } from '@broker/api'

export type ProductSharePayload = {
  code: string
  message: string
}

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
