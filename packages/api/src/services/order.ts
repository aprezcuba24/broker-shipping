import type { OrderCreate, OrderDetail, OrderLineCreate } from "../generated/models";
import { createOrderOrdersPost } from "../generated/orders/orders";

export function createOrder(values: OrderCreate, lines: OrderLineCreate[]): Promise<OrderDetail> {
  const mappedLines = lines.map((line) => ({
    product_id: line.product_id,
    quantity: line.quantity,
    price: line.price,
  }))
  const data: OrderCreate = {
    lines: mappedLines,
  }
  if ((values as any).customerId) {
    data.customer_id = (values as any).customerId
  } else {
    data.customer = values.customer
  }
  if ((values as any).addressId) {
    data.address_id = (values as any).addressId
  } else {
    data.address = values.address
  }

  return createOrderOrdersPost(data)
}