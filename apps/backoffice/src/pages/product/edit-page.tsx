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

function productToFormValues(product: ProductPublic): ProductFormValues {
  return {
    name: product.name,
    tag_ids: product.tags?.map((tag) => tag.id) ?? [],
    price: product.price,
    commission: product.commission,
    currency: product.currency,
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

  const productQuery = useGetProductProductsProviderProductIdGet(
    productId,
    detailParams,
    { query: { enabled: Boolean(productId) } },
  )

  const patchMutation = usePatchProductProductsProviderProductIdPatch()

  const update = useEntityFormMutation({
    mutate: (values: ProductFormValues) =>
      patchMutation.mutateAsync({
        productId,
        data: {
          name: values.name,
          tag_ids: values.tag_ids,
          price: values.price,
          commission: values.commission,
          currency: values.currency,
        },
        params: {} as PatchProductProductsProviderProductIdPatchParams,
      }),
    detailQueryKey,
    invalidateKeys: [
      getListProductsProductsProviderGetQueryKey(),
      detailQueryKey,
    ],
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
