import { OrdersProvider } from './orders-context'
import { OrderTable } from './table'

export function OrderPage() {
  return (
    <OrdersProvider>
      <OrderTable />
    </OrdersProvider>
  )
}
