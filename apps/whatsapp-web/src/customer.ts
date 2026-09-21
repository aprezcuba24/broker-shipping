import type { ChatKind, DetectedChat } from './detect-chat'

export type CustomerProfile = {
  name: string
  phone: string
  kindLabel: string
  kind: ChatKind
  presence: string | null
  isVerified: boolean
  isBusiness: boolean
  isSavedContact: boolean | null
  about: string | null
  email: string | null
  website: string | null
  participantCount: number | null
  address: string | null
}

function phoneLabel(chat: DetectedChat): string {
  if (chat.phone) return chat.phone
  if (chat.phoneStatus === 'unavailable') return 'No se pudo obtener'
  return 'No disponible'
}

export function buildCustomer(chat: DetectedChat): CustomerProfile {
  return {
    name: chat.name ?? chat.phone ?? 'Sin nombre',
    phone: phoneLabel(chat),
    kindLabel: chat.kindLabel,
    kind: chat.kind,
    presence: chat.presence,
    isVerified: chat.isVerified,
    isBusiness: chat.isBusiness,
    isSavedContact: chat.isSavedContact,
    about: chat.about,
    email: chat.email,
    website: chat.website,
    participantCount: chat.participantCount,
    address: null,
  }
}
