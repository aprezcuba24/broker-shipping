import {
  getListProductsProductsProviderGetQueryKey,
  useCreateProductProductsProviderPost,
} from '@broker/api'
import {
  EntityFormPage,
  useActiveOrganization,
  useAsyncAction,
} from '@broker/ui'
import { Package } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import { ProductForm, productFormDefaultValues, type ProductFormValues } from './form'

export function ProductCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeOrganization } = useActiveOrganization()
  const createMutation = useCreateProductProductsProviderPost()

  const create = useAsyncAction(
    async (values: ProductFormValues) => {
      return createMutation.mutateAsync({
        data: values,
        params: { organization_id: activeOrganization!.id },
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
