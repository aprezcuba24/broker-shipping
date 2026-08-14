import { useCallback, useMemo } from 'react'
import {
  confirmProductImageProductsProviderProductIdImagePut,
  deleteProductImageProductsProviderProductIdImageDelete,
  presignProductImageProductsProviderProductIdImagePresignPost,
  ProductImagePresignRequestContentType,
  type ConfirmProductImageProductsProviderProductIdImagePutParams,
  type DeleteProductImageProductsProviderProductIdImageDeleteParams,
  type PresignProductImageProductsProviderProductIdImagePresignPostParams,
  type ProductPublic,
} from '@broker/api'
import { useResourceImagePersist } from '@broker/ui'

const emptyPresignParams =
  {} as PresignProductImageProductsProviderProductIdImagePresignPostParams
const emptyConfirmParams =
  {} as ConfirmProductImageProductsProviderProductIdImagePutParams
const emptyDeleteParams =
  {} as DeleteProductImageProductsProviderProductIdImageDeleteParams

/**
 * Product-scoped adapter around `useResourceImagePersist`.
 * Call from create/edit pages; pass `persist` into the form mutation.
 */
export function useProductImagePersist() {
  const presign = useCallback(async (productId: string, contentType: string) => {
    const result = await presignProductImageProductsProviderProductIdImagePresignPost(
      productId,
      {
        content_type: contentType as ProductImagePresignRequestContentType,
      },
      emptyPresignParams,
    )
    return {
      upload_url: result.upload_url,
      image_key: result.image_key,
      headers: result.headers as Record<string, string>,
    }
  }, [])

  const confirm = useCallback(async (productId: string, imageKey: string) => {
    return confirmProductImageProductsProviderProductIdImagePut(
      productId,
      { image_key: imageKey },
      emptyConfirmParams,
    )
  }, [])

  const remove = useCallback(async (productId: string) => {
    await deleteProductImageProductsProviderProductIdImageDelete(
      productId,
      emptyDeleteParams,
    )
  }, [])

  const { persist: persistImage } = useResourceImagePersist<ProductPublic>({
    presign,
    confirm,
    remove,
  })

  const persist = useCallback(
    async (
      product: ProductPublic,
      image: Parameters<typeof persistImage>[1],
    ): Promise<ProductPublic> => {
      const result = await persistImage(product.id, image)
      if (result) return result
      if (image?.removed && !image.file) {
        return { ...product, image_url: null }
      }
      return product
    },
    [persistImage],
  )

  return useMemo(() => ({ persist }), [persist])
}
