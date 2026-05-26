import {
  getListCategoriesProductsCategoriesGetQueryKey,
  useCreateCategoryProductsCategoriesPost,
  useDeleteCategoryProductsCategoriesCategoryIdDelete,
  useListCategoriesProductsCategoriesGet,
  usePatchCategoryProductsCategoriesCategoryIdPatch,
  type Category,
} from '@broker/api'
import { useCRUD, type CrudContextValue } from '@broker/ui'
import {
  createContext,
  useContext,
  type ReactNode,
} from 'react'

export type CategoryFormValues = {
  name: string
}

export type CategoriesContextValue = CrudContextValue<
  Category,
  CategoryFormValues
>

const CategoriesContext = createContext<CategoriesContextValue | null>(null)

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const value = useCRUD<
    Category,
    CategoryFormValues,
    { data: { name: string } },
    { categoryId: string; data: { name: string } },
    { categoryId: string }
  >({
    useList: useListCategoriesProductsCategoriesGet,
    getListQueryKey: getListCategoriesProductsCategoriesGetQueryKey,
    useCreate: useCreateCategoryProductsCategoriesPost,
    usePatch: usePatchCategoryProductsCategoriesCategoryIdPatch,
    useDelete: useDeleteCategoryProductsCategoriesCategoryIdDelete,
    toCreateVariables: (values) => ({ data: { name: values.name } }),
    toPatchVariables: (category, values) =>
      category.id
        ? { categoryId: category.id, data: { name: values.name } }
        : null,
    toDeleteVariables: (category) =>
      category.id ? { categoryId: category.id } : null,
  })
  return <CategoriesContext value={value}>{children}</CategoriesContext>
}

export function useCategories(): CategoriesContextValue {
  const context = useContext(CategoriesContext)
  if (!context) {
    throw new Error('useCategories must be used within CategoriesProvider')
  }
  return context
}
