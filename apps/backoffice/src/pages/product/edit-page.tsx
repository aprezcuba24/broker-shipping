import {
  getListProductsProductsProviderGetQueryKey,
  useGetProductProductsProviderProductIdGet,
  usePatchProductProductsProviderProductIdPatch,
  type GetProductProductsProviderProductIdGetParams,
  type PatchProductProductsProviderProductIdPatchParams,
} from '@broker/api'
import { EntityEditFormPage, useAsyncAction } from '@broker/ui'
import { Package } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import { ProductForm, type ProductFormValues } from './form'

export function ProductEditPage() {
  const { productId = '' } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const productQuery = useGetProductProductsProviderProductIdGet(
    productId,
    {} as GetProductProductsProviderProductIdGetParams,
    { query: { enabled: Boolean(productId) } },
  )

  const patchMutation = usePatchProductProductsProviderProductIdPatch()

  const update = useAsyncAction(
    async (values: ProductFormValues) => {
      return patchMutation.mutateAsync({
        productId,
        data: values,
        params: {} as PatchProductProductsProviderProductIdPatchParams,
      })
    },
    async () => {
      await queryClient.invalidateQueries({
        queryKey: getListProductsProductsProviderGetQueryKey(),
      })
      navigate('/products')
    },
  )

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
      formKey={(product) => product.id}
      onSubmit={update.run}
      isSubmitting={update.isPending}
      error={update.error}
      submitLabel="Guardar"
    />
  )
}
