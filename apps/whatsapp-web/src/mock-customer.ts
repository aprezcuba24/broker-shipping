import type { ChatKind, DetectedChat } from './detect-chat'

export type MockCustomer = {
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
  /** Demo CRM fields (still hard-coded for the POC). */
  crmStatus: string
  purchases: string
  lastOrder: string
}

function phoneLabel(chat: DetectedChat): string {
  if (chat.phone) return chat.phone
  if (chat.phoneStatus === 'unavailable') return 'No se pudo obtener'
  return 'No disponible'
}

function savedContactLabel(value: boolean | null): string | null {
  if (value === true) return 'Sí (en agenda)'
  if (value === false) return 'No (número sin guardar)'
  return null
}

export function buildMockCustomer(chat: DetectedChat): MockCustomer {
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
    crmStatus: 'Cliente',
    purchases: '$350',
    lastOrder: '#1234',
  }
}

export function formatSavedContact(value: boolean | null): string | null {
  return savedContactLabel(value)
}
