import {
  getListProductsProductsProviderGetQueryKey,
  useCreateProductProductsProviderPost,
  type CreateProductProductsProviderPostParams,
} from '@broker/api'
import { EntityFormPage, useEntityFormMutation } from '@broker/ui'
import { Package } from 'lucide-react'

import { ProductForm, productFormDefaultValues, type ProductFormValues } from './form'

export function ProductCreatePage() {
  const createMutation = useCreateProductProductsProviderPost()

  const create = useEntityFormMutation({
    mutate: (values: ProductFormValues) =>
      createMutation.mutateAsync({
        data: values,
        params: {} as CreateProductProductsProviderPostParams,
      }),
    invalidateKeys: [getListProductsProductsProviderGetQueryKey()],
    redirectTo: '/products',
  })

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
