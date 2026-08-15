import {
  getListProductsProductsProviderGetQueryKey,
  useCreateProductProductsProviderPost,
  type CreateProductProductsProviderPostParams,
  type ProductPublic,
} from '@broker/api'
import { EntityFormPage, notify, useEntityFormMutation } from '@broker/ui'
import { Package } from 'lucide-react'

import { ProductForm, productFormDefaultValues, type ProductFormValues } from './form'
import { useProductImagePersist } from './persist-image'

export function ProductCreatePage() {
  const createMutation = useCreateProductProductsProviderPost()
  const { persist } = useProductImagePersist()

  const create = useEntityFormMutation({
    mutate: async (values: ProductFormValues): Promise<ProductPublic> => {
      const { image, ...data } = values
      const product = await createMutation.mutateAsync({
        data: {
          name: data.name,
          tag_ids: data.tag_ids,
          price: data.price,
          commission: data.commission,
          currency: data.currency,
        },
        params: {} as CreateProductProductsProviderPostParams,
      })

      try {
        return await persist(product, image)
      } catch (err) {
        // Product already exists — avoid leaving the user on /new (retry would duplicate).
        notify.error(err, 'Producto creado, pero no se pudo guardar la imagen')
        return product
      }
    },
    invalidateKeys: [getListProductsProductsProviderGetQueryKey()],
    redirectTo: '/products',
    entityLabel: 'Producto',
    mode: 'create',
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
