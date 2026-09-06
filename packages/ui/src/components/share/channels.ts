import { Copy, MessageCircle } from 'lucide-react'

import { notify } from '../../lib/notify'

import type { ShareChannel, SharePayload } from './types'

function shareText(payload: SharePayload): string {
  const { url, text } = payload
  return text ? `${text}\n${url}` : url
}

async function copyToClipboard(payload: SharePayload): Promise<void> {
  try {
    await navigator.clipboard.writeText(shareText(payload))
    notify.success('Enlace copiado')
  } catch (error) {
    notify.error(error, 'No se pudo copiar el enlace.')
  }
}

export const copyShareChannel: ShareChannel = {
  id: 'copy',
  label: 'Copiar enlace',
  icon: Copy,
  onShare: copyToClipboard,
}

export const whatsappShareChannel: ShareChannel = {
  id: 'whatsapp',
  label: 'WhatsApp',
  icon: MessageCircle,
  getHref: (payload) =>
    `https://wa.me/?text=${encodeURIComponent(shareText(payload))}`,
}

/** Default channels: copy + WhatsApp. Pass extra channels via ShareActions. */
export const defaultShareChannels: ShareChannel[] = [
  copyShareChannel,
  whatsappShareChannel,
]
