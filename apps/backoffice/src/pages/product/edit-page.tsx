import {
  getGetProductProductsProviderProductIdGetQueryKey,
  getListProductsProductsProviderGetQueryKey,
  useGetProductProductsProviderProductIdGet,
  usePatchProductProductsProviderProductIdPatch,
  type GetProductProductsProviderProductIdGetParams,
  type PatchProductProductsProviderProductIdPatchParams,
} from '@broker/api'
import {
  EntityEditFormPage,
  entityFormKey,
  useEntityFormMutation,
} from '@broker/ui'
import { Package } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { ProductForm, type ProductFormValues } from './form'

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
        data: values,
        params: {} as PatchProductProductsProviderProductIdPatchParams,
      }),
    detailQueryKey,
    invalidateKeys: [
      getListProductsProductsProviderGetQueryKey(),
      detailQueryKey,
    ],
    redirectTo: '/products',
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
      defaultValues={(product) => ({ name: product.name })}
      formKey={(product) => entityFormKey(product)}
      onSubmit={update.run}
      isSubmitting={update.isPending}
      error={update.error}
      submitLabel="Guardar"
    />
  )
}
