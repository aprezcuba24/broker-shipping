import { useCallback, useMemo } from 'react'
import {
  AdsMessagePhotoPresignRequestContentType,
  confirmAdsMessagePhotoFacebookAdsMessagesAdsMessageIdPhotoPut,
  deleteAdsMessagePhotoFacebookAdsMessagesAdsMessageIdPhotoDelete,
  presignAdsMessagePhotoFacebookAdsMessagesAdsMessageIdPhotoPresignPost,
  type AdsMessagePublic,
  type ConfirmAdsMessagePhotoFacebookAdsMessagesAdsMessageIdPhotoPutParams,
  type DeleteAdsMessagePhotoFacebookAdsMessagesAdsMessageIdPhotoDeleteParams,
  type PresignAdsMessagePhotoFacebookAdsMessagesAdsMessageIdPhotoPresignPostParams,
} from '@broker/api'
import { useResourceImagePersist } from '@broker/ui'

const emptyPresignParams =
  {} as PresignAdsMessagePhotoFacebookAdsMessagesAdsMessageIdPhotoPresignPostParams
const emptyConfirmParams =
  {} as ConfirmAdsMessagePhotoFacebookAdsMessagesAdsMessageIdPhotoPutParams
const emptyDeleteParams =
  {} as DeleteAdsMessagePhotoFacebookAdsMessagesAdsMessageIdPhotoDeleteParams

export function useAdsMessageImagePersist() {
  const presign = useCallback(async (adsMessageId: string, contentType: string) => {
    const result =
      await presignAdsMessagePhotoFacebookAdsMessagesAdsMessageIdPhotoPresignPost(
        adsMessageId,
        {
          content_type: contentType as AdsMessagePhotoPresignRequestContentType,
        },
        emptyPresignParams,
      )
    return {
      upload_url: result.upload_url,
      image_key: result.image_key,
      headers: result.headers as Record<string, string>,
    }
  }, [])

  const confirm = useCallback(async (adsMessageId: string, imageKey: string) => {
    return confirmAdsMessagePhotoFacebookAdsMessagesAdsMessageIdPhotoPut(
      adsMessageId,
      { image_key: imageKey },
      emptyConfirmParams,
    )
  }, [])

  const remove = useCallback(async (adsMessageId: string) => {
    await deleteAdsMessagePhotoFacebookAdsMessagesAdsMessageIdPhotoDelete(
      adsMessageId,
      emptyDeleteParams,
    )
  }, [])

  const { persist: persistImage } = useResourceImagePersist<AdsMessagePublic>({
    presign,
    confirm,
    remove,
  })

  const persist = useCallback(
    async (
      message: AdsMessagePublic,
      image: Parameters<typeof persistImage>[1],
    ): Promise<AdsMessagePublic> => {
      const result = await persistImage(message.id, image)
      if (result) return result
      if (image?.removed && !image.file) {
        return { ...message, photo_url: null }
      }
      return message
    },
    [persistImage],
  )

  return useMemo(() => ({ persist }), [persist])
}
