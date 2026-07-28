import {
  getListProductsProductsProviderGetQueryKey,
  useCreateProductProductsProviderPost,
  useGetProductProductsProviderProductIdGet,
  usePatchProductProductsProviderProductIdPatch,
} from '@broker/api'
import {
  EntityFormPage,
  PageLoading,
  PageMessage,
  useActiveOrganization,
  useAsyncAction,
} from '@broker/ui'
import { Package } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import { ProductForm, productFormDefaultValues, type ProductFormValues } from './form'

export function ProductCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeOrganization } = useActiveOrganization()
  const createMutation = useCreateProductProductsProviderPost()

  const create = useAsyncAction(
    async (values: ProductFormValues) => {
      if (!activeOrganization?.id) {
        throw new Error('Selecciona una organización activa')
      }
      return createMutation.mutateAsync({
        data: values,
        params: { organization_id: activeOrganization.id },
      })
    },
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getListProductsProductsProviderGetQueryKey(),
        })
        navigate('/products')
      },
    },
  )

  return (
    <EntityFormPage
      title="Nuevo producto"
      description="Crea un producto para la organización activa."
      icon={Package}
      Form={ProductForm}
      defaultValues={productFormDefaultValues}
      formKey="create"
      onSubmit={create.run}
      isSubmitting={create.isPending}
      error={create.error}
      submitLabel="Crear"
      backTo="/products"
    />
  )
}

export function ProductEditPage() {
  const { productId = '' } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeOrganization } = useActiveOrganization()

  const productQuery = useGetProductProductsProviderProductIdGet(
    productId,
    { organization_id: activeOrganization?.id ?? '' },
    { query: { enabled: Boolean(productId && activeOrganization?.id) } },
  )

  const patchMutation = usePatchProductProductsProviderProductIdPatch()

  const update = useAsyncAction(
    async (values: ProductFormValues) => {
      if (!activeOrganization?.id) {
        throw new Error('Selecciona una organización activa')
      }
      return patchMutation.mutateAsync({
        productId,
        data: values,
        params: { organization_id: activeOrganization.id },
      })
    },
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getListProductsProductsProviderGetQueryKey(),
        })
        navigate('/products')
      },
    },
  )

  if (productQuery.isLoading) {
    return <PageLoading title="Editar producto" />
  }

  if (productQuery.isError || !productQuery.data) {
    return (
      <PageMessage
        title="Producto no encontrado"
        message="No se pudo cargar el producto solicitado."
        backTo="/products"
      />
    )
  }

  return (
    <EntityFormPage
      title="Editar producto"
      description={`Edita «${productQuery.data.name}».`}
      icon={Package}
      Form={ProductForm}
      defaultValues={{ name: productQuery.data.name }}
      formKey={productQuery.data.id}
      onSubmit={update.run}
      isSubmitting={update.isPending}
      error={update.error}
      submitLabel="Guardar"
      backTo="/products"
    />
  )
}
