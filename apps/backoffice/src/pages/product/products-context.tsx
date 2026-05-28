import {
  getListProductsProductsGetQueryKey,
  useCreateProductProductsPost,
  useDeleteProductProductsProductIdDelete,
  useListProductsProductsGet,
  usePatchProductProductsProductIdPatch,
  type Product,
} from '@broker/api'
import { useCRUD, type CrudContextValue } from '@broker/ui'
import { createContext, useContext, type ReactNode } from 'react'

export type ProductFormValues = {
  name: string
  category_id: string
}

export type ProductsContextValue = CrudContextValue<
  Product,
  ProductFormValues
>

const ProductsContext = createContext<ProductsContextValue | null>(null)

export function ProductsProvider({ children }: { children: ReactNode }) {
  const value = useCRUD<
    Product,
    ProductFormValues,
    { data: { name: string; category_id: string } },
    { productId: string; data: { name: string; category_id: string } },
    { productId: string }
  >({
    useList: useListProductsProductsGet,
    getListQueryKey: getListProductsProductsGetQueryKey,
    useCreate: useCreateProductProductsPost,
    usePatch: usePatchProductProductsProductIdPatch,
    useDelete: useDeleteProductProductsProductIdDelete,
    toCreateVariables: (values) => ({
      data: { name: values.name, category_id: values.category_id },
    }),
    toPatchVariables: (product, values) =>
      product.id
        ? {
            productId: product.id,
            data: { name: values.name, category_id: values.category_id },
          }
        : null,
    toDeleteVariables: (product) =>
      product.id ? { productId: product.id } : null,
  })
  return <ProductsContext value={value}>{children}</ProductsContext>
}

export function useProducts(): ProductsContextValue {
  const context = useContext(ProductsContext)
  if (!context) {
    throw new Error('useProducts must be used within ProductsProvider')
  }
  return context
}
