import type { AddressPublic } from '../generated/models/addressPublic'

const dateTimeFormatter = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date)
}

export function formatAddressLine(
  address: Pick<AddressPublic, 'address' | 'municipality_name' | 'province_name'> | null | undefined,
): string {
  if (!address) return '—'
  const parts = [
    address.address,
    address.municipality_name,
    address.province_name,
  ].filter(Boolean)
  return parts.join(' · ') || '—'
}
