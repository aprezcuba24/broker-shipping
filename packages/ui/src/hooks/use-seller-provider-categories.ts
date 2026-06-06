import { useListCategoriesProductsSellerCategoriesProviderIdGet } from '@broker/api'
import { useCallback, useMemo } from 'react'

export function useSellerProviderCategories(providerId: string) {
  const { data: categories = [], isLoading, isError } =
    useListCategoriesProductsSellerCategoriesProviderIdGet(providerId, {
      query: { enabled: !!providerId },
    })

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )

  const getCategoryName = useCallback(
    (categoryId: string, fallback = '—') =>
      categoryMap.get(categoryId) ?? fallback,
    [categoryMap],
  )

  return { categories, categoryMap, getCategoryName, isLoading, isError }
}
