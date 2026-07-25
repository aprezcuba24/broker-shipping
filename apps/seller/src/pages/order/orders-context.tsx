import {
  getListSellerOrdersOrdersSellerGetQueryKey,
  type OrderDetail,
} from '@broker/api'
import { brokerFetch } from '@broker/api'
import {
  pickQueryParams,
  useActiveOrganization,
  useResetOnChange,
  useUrlSearchFilters,
} from '@broker/ui'
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

export const orderListFilterKeys = [
  'name',
  'customer_name',
  'customer_phone',
  'provider_organization_id',
  'created_at_from',
  'created_at_to',
] as const

export type OrderListFilters = Record<(typeof orderListFilterKeys)[number], string>

export type OrdersContextValue = {
  items: OrderDetail[]
  isLoading: boolean
  page: number
  setPage: (page: number) => void
  filters: OrderListFilters
  setFilter: (key: keyof OrderListFilters, value: string) => void
}

const OrdersContext = createContext<OrdersContextValue | null>(null)

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { activeOrganization } = useActiveOrganization()
  const { filters, setFilter, resetFilters } = useUrlSearchFilters({
    keys: orderListFilterKeys,
  })

  const [page, setPage] = useState(1)

  const requestParams = useMemo(() => pickQueryParams(filters), [filters])

  const listParamsKey = useMemo(() => JSON.stringify(requestParams ?? {}), [requestParams])

  const prevListParamsKeyRef = useRef(listParamsKey)

  useEffect(() => {
    if (prevListParamsKeyRef.current !== listParamsKey) {
      prevListParamsKeyRef.current = listParamsKey
      setPage(1)
    }
  }, [listParamsKey])

  useResetOnChange({
    resetOnChange: [activeOrganization?.id],
    getQueryKey: getListSellerOrdersOrdersSellerGetQueryKey,
    onReset: resetFilters,
    setPage,
  })

  const { data: items = [], isLoading } = useQuery({
    queryKey: [...getListSellerOrdersOrdersSellerGetQueryKey(), requestParams ?? {}],
    queryFn: ({ signal }) =>
      brokerFetch<OrderDetail[]>({
        url: '/orders/seller/',
        method: 'GET',
        params: requestParams,
        signal,
      }),
  })

  return (
    <OrdersContext
      value={{
        items,
        isLoading,
        page,
        setPage,
        filters,
        setFilter,
      }}
    >
      {children}
    </OrdersContext>
  )
}

export function useOrders(): OrdersContextValue {
  const context = useContext(OrdersContext)
  if (!context) {
    throw new Error('useOrders must be used within OrdersProvider')
  }
  return context
}
