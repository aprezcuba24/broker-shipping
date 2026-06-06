import {
  getListProductsProductsSellerGetQueryKey,
  type Product,
} from '@broker/api'
import { brokerFetch } from '@broker/api'
import { pickQueryParams, useUrlSearchFilters } from '@broker/ui'
import { useQuery } from '@tanstack/react-query'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export const productListFilterKeys = ['name', 'provider_id', 'category_id'] as const

export type ProductListFilters = Record<
  (typeof productListFilterKeys)[number],
  string
>

export type ProductsContextValue = {
  items: Product[]
  isLoading: boolean
  page: number
  setPage: (page: number) => void
  filters: ProductListFilters
  setFilter: (key: keyof ProductListFilters, value: string) => void
  setFilters: (updates: Partial<ProductListFilters>) => void
}

const ProductsContext = createContext<ProductsContextValue | null>(null)

export function ProductsProvider({ children }: { children: ReactNode }) {
  const { filters, setFilter, setFilters } = useUrlSearchFilters({
    keys: productListFilterKeys,
  })

  const [page, setPage] = useState(1)

  const requestParams = useMemo(() => pickQueryParams(filters), [filters])

  const listParamsKey = useMemo(
    () => JSON.stringify(requestParams ?? {}),
    [requestParams],
  )

  const prevListParamsKeyRef = useRef(listParamsKey)

  useEffect(() => {
    if (prevListParamsKeyRef.current !== listParamsKey) {
      prevListParamsKeyRef.current = listParamsKey
      setPage(1)
    }
  }, [listParamsKey])

  const { data: items = [], isLoading } = useQuery({
    queryKey: [...getListProductsProductsSellerGetQueryKey(), requestParams ?? {}],
    queryFn: ({ signal }) =>
      brokerFetch<Product[]>({
        url: '/products/seller/',
        method: 'GET',
        params: requestParams,
        signal,
      }),
  })

  return (
    <ProductsContext
      value={{
        items,
        isLoading,
        page,
        setPage,
        filters,
        setFilter,
        setFilters,
      }}
    >
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
