/**
 * Stable remount key for full-page edit forms. Includes `updated_at` so
 * react-hook-form picks up fresh `defaultValues` after a cache refresh.
 */
export function entityFormKey(item: {
  id: string
  updated_at?: string | null
}): string {
  return `${item.id}-${item.updated_at ?? ''}`
}
