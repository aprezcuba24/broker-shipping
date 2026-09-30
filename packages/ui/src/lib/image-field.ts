import { z } from 'zod'

export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp'
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024

export const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

export type ImageFieldValue = {
  /** Remote URL of an already-saved image. */
  url?: string | null
  /** Local file pending upload on submit. */
  file?: File | null
  /** When true, delete the remote image on submit (ignored if `file` is set). */
  removed?: boolean
}

export const imageFieldDefaultValue: ImageFieldValue = {
  url: null,
  file: null,
  removed: false,
}

export const imageFieldSchema = z.object({
  url: z.string().nullable().optional(),
  file: z.instanceof(File).nullable().optional(),
  removed: z.boolean().optional(),
})

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return 'Formato no permitido. Usa JPEG, PNG o WebP.'
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return 'La imagen no puede superar 5 MB.'
  }
  return null
}

function extensionForImageType(type: string): string {
  if (type === 'image/jpeg') return 'jpg'
  if (type === 'image/webp') return 'webp'
  return 'png'
}

/** Rename generic clipboard captures (e.g. `image.png`) to a stable local name. */
function ensureClipboardFileName(file: File): File {
  const name = file.name?.trim() ?? ''
  const isGenericName = name === '' || /^image\.[a-z0-9]+$/i.test(name)
  if (!isGenericName) return file

  const ext = extensionForImageType(file.type)
  return new File([file], `portapapeles.${ext}`, {
    type: file.type,
    lastModified: file.lastModified,
  })
}

/**
 * Returns the first allowed image file from a paste event's clipboard data,
 * or `null` when the clipboard has no image (so text paste can proceed).
 */
export function fileFromClipboardData(clipboardData: DataTransfer | null): File | null {
  if (!clipboardData) return null

  for (const item of Array.from(clipboardData.items ?? [])) {
    if (item.kind !== 'file' || !ALLOWED_IMAGE_TYPES.has(item.type)) continue
    const file = item.getAsFile()
    if (file) return ensureClipboardFileName(file)
  }

  for (const file of Array.from(clipboardData.files ?? [])) {
    if (ALLOWED_IMAGE_TYPES.has(file.type)) {
      return ensureClipboardFileName(file)
    }
  }

  return null
}

/** Whether the field has a pending upload or delete to persist. */
export function imageFieldHasPendingChange(value: ImageFieldValue | undefined | null): boolean {
  if (!value) return false
  if (value.file) return true
  if (value.removed && value.url) return true
  return false
}
