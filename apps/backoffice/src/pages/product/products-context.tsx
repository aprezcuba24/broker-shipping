import {
  getListProductsProductsGetQueryKey,
  useCreateProductProductsPost,
  useDeleteProductProductsProductIdDelete,
  useListProductsProductsGet,
  usePatchProductProductsProductIdPatch,
  type Product,
  type ProductCreate,
} from '@broker/api'
import { useCRUD, useUrlSearchFilters, type CrudContextValue } from '@broker/ui'
import { toPriceCents } from '@broker/ui'
import { createContext, useContext, type ReactNode } from 'react'
import { z } from 'zod'

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  category_id: z.string().min(1, 'La categoría es obligatoria'),
  price: z
    .number({ message: 'El precio es obligatorio' })
    .min(0, 'El precio no puede ser negativo'),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export const productListFilterKeys = ['name', 'category_id'] as const

export type ProductListFilters = Record<
  (typeof productListFilterKeys)[number],
  string
>

export type ProductsContextValue = CrudContextValue<
  Product,
  ProductFormValues
> & {
  filters: ProductListFilters
  setFilter: (key: keyof ProductListFilters, value: string) => void
}

const ProductsContext = createContext<ProductsContextValue | null>(null)

export function ProductsProvider({ children }: { children: ReactNode }) {
  const { filters, setFilter } = useUrlSearchFilters({
    keys: productListFilterKeys,
  })

  const crud = useCRUD<
    Product,
    ProductFormValues,
    { data: ProductCreate },
    {
      productId: string
      data: { name: string; category_id: string; price: number }
    },
    { productId: string }
  >({
    useList: useListProductsProductsGet,
    getListQueryKey: getListProductsProductsGetQueryKey,
    filters,
    useCreate: useCreateProductProductsPost,
    usePatch: usePatchProductProductsProductIdPatch,
    useDelete: useDeleteProductProductsProductIdDelete,
    toCreateVariables: (values) => ({
      data: {
        name: values.name,
        category_id: values.category_id,
        price: toPriceCents(values.price),
      },
    }),
    toPatchVariables: (product, values) =>
      product.id
        ? {
            productId: product.id,
            data: {
              name: values.name,
              category_id: values.category_id,
              price: toPriceCents(values.price),
            },
          }
        : null,
    toDeleteVariables: (product) =>
      product.id ? { productId: product.id } : null,
  })

  return (
    <ProductsContext value={{ ...crud, filters, setFilter }}>
      {children}
    </ProductsContext>
  )
}

export function useProducts(): ProductsContextValue {
  const context = useContext(ProductsContext)
  if (!context) {
    throw new Error('useProducts must be used within ProductsProvider')
  }
  return context
}
