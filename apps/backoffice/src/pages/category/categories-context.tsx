import { useActiveOrganization } from '@/contexts/active-organization-context'
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
import { z } from 'zod'

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  organization_id: z.string().nullish(),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

export type CategoriesContextValue = CrudContextValue<
  Category,
  CategoryFormValues
>

const CategoriesContext = createContext<CategoriesContextValue | null>(null)

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const { activeOrganization } = useActiveOrganization()
  const value = useCRUD<
    Category,
    CategoryFormValues,
    { data: Category },
    { categoryId: string; data: { name: string } },
    { categoryId: string }
  >({
    useList: useListCategoriesProductsCategoriesGet,
    getListQueryKey: getListCategoriesProductsCategoriesGetQueryKey,
    useCreate: useCreateCategoryProductsCategoriesPost,
    usePatch: usePatchCategoryProductsCategoriesCategoryIdPatch,
    useDelete: useDeleteCategoryProductsCategoriesCategoryIdDelete,
    toCreateVariables: (values) => ({
      data: {
        ...values,
        organization_id: values.organization_id ?? activeOrganization?.id ?? '',
      } as Category,
    }),
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
