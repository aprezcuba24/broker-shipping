import { useCallback } from 'react'

import {
  validateImageFile,
  type ImageFieldValue,
} from '../../lib/image-field'

export type ResourceImagePresignResult = {
  upload_url: string
  image_key: string
  headers: Record<string, string>
}

export type UseResourceImagePersistOptions<TResult> = {
  presign: (
    resourceId: string,
    contentType: string,
  ) => Promise<ResourceImagePresignResult>
  confirm: (resourceId: string, imageKey: string) => Promise<TResult>
  remove: (resourceId: string) => Promise<unknown>
}

export type ResourceImagePersist<TResult> = {
  persist: (
    resourceId: string,
    value: ImageFieldValue | undefined | null,
  ) => Promise<TResult | undefined>
}

/**
 * Generic image persistence: inject resource-specific presign / confirm / remove.
 * Upload flow: validate → presign → PUT to storage → confirm.
 * Delete flow: remove when `value.removed` and no pending file.
 */
export function useResourceImagePersist<TResult>({
  presign,
  confirm,
  remove,
}: UseResourceImagePersistOptions<TResult>): ResourceImagePersist<TResult> {
  const persist = useCallback(
    async (
      resourceId: string,
      value: ImageFieldValue | undefined | null,
    ): Promise<TResult | undefined> => {
      if (!value) return undefined

      if (value.file) {
        const validationError = validateImageFile(value.file)
        if (validationError) {
          throw new Error(validationError)
        }

        const contentType = value.file.type
        const signed = await presign(resourceId, contentType)

        const putResponse = await fetch(signed.upload_url, {
          method: 'PUT',
          body: value.file,
          headers: {
            ...signed.headers,
            'Content-Type': contentType,
          },
        })

        if (!putResponse.ok) {
          throw new Error(
            `No se pudo subir la imagen al almacenamiento (${putResponse.status}).`,
          )
        }

        return confirm(resourceId, signed.image_key)
      }

      if (value.removed) {
        await remove(resourceId)
        return undefined
      }

      return undefined
    },
    [presign, confirm, remove],
  )

  return { persist }
}
