import {
  getGetProductProductsProviderProductIdGetQueryKey,
  getListProductsProductsProviderGetQueryKey,
  useGetProductProductsProviderProductIdGet,
  usePatchProductProductsProviderProductIdPatch,
  type GetProductProductsProviderProductIdGetParams,
  type PatchProductProductsProviderProductIdPatchParams,
  type ProductPublic,
} from '@broker/api'
import {
  EntityEditFormPage,
  entityFormKey,
  useEntityFormMutation,
} from '@broker/ui'
import { Package } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { ProductForm, type ProductFormValues } from './form'
import { useProductImagePersist } from './persist-image'

function productToFormValues(product: ProductPublic): ProductFormValues {
  return {
    name: product.name,
    tag_ids: product.tags?.map((tag) => tag.id) ?? [],
    price: product.price,
    commission: product.commission,
    currency: product.currency,
    image: {
      url: product.image_url ?? null,
      file: null,
      removed: false,
    },
  }
}

function productInitialTags(product: ProductPublic) {
  return (product.tags ?? []).map((tag) => ({ id: tag.id, name: tag.name }))
}

export function ProductEditPage() {
  const { productId = '' } = useParams<{ productId: string }>()

  const detailParams = {} as GetProductProductsProviderProductIdGetParams
  const detailQueryKey = getGetProductProductsProviderProductIdGetQueryKey(
    productId,
    detailParams,
  )
  const listQueryKey = getListProductsProductsProviderGetQueryKey()

  const productQuery = useGetProductProductsProviderProductIdGet(
    productId,
    detailParams,
    { query: { enabled: Boolean(productId) } },
  )

  const patchMutation = usePatchProductProductsProviderProductIdPatch()
  const { persist } = useProductImagePersist()

  const update = useEntityFormMutation({
    mutate: async (values: ProductFormValues): Promise<ProductPublic> => {
      const { image, ...data } = values
      const product = await patchMutation.mutateAsync({
        productId,
        data: {
          name: data.name,
          tag_ids: data.tag_ids,
          price: data.price,
          commission: data.commission,
          currency: data.currency,
        },
        params: {} as PatchProductProductsProviderProductIdPatchParams,
      })
      return persist(product, image)
    },
    detailQueryKey,
    invalidateKeys: [listQueryKey, detailQueryKey],
    redirectTo: '/products',
    entityLabel: 'Producto',
    mode: 'update',
  })

  return (
    <EntityEditFormPage
      isLoading={productQuery.isLoading}
      isError={productQuery.isError}
      data={productQuery.data}
      loadingTitle="Editar producto"
      notFoundTitle="Producto no encontrado"
      notFoundMessage="No se pudo cargar el producto solicitado."
      backTo="/products"
      title="Editar producto"
      description={(product) => `Edita «${product.name}».`}
      icon={Package}
      Form={ProductForm}
      defaultValues={productToFormValues}
      formKey={(product) => entityFormKey(product)}
      formProps={
        productQuery.data
          ? { initialTags: productInitialTags(productQuery.data) }
          : undefined
      }
      onSubmit={update.run}
      isSubmitting={update.isPending}
      error={update.error}
      submitLabel="Guardar"
    />
  )
}
