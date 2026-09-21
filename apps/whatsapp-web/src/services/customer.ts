import { normalizePhone } from '../phone'
import { apiRequest } from './http'
import {
  EMPTY_CUSTOMER_LOOKUP,
  type CustomerLookup,
  type CustomerPublic,
  type OrderPublic,
  type Page,
} from './types'

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

/** Prefer exact digit match, then single ILIKE hit, then prefix/suffix overlap. */
function pickCustomer(
  items: CustomerPublic[],
  phoneDigits: string,
): CustomerPublic | null {
  if (items.length === 0) return null

  const exact = items.find((c) => digitsOnly(c.phone) === phoneDigits)
  if (exact) return exact

  if (items.length === 1) return items[0]

  const byOverlap = items.find((c) => {
    const stored = digitsOnly(c.phone)
    return (
      stored.length > 0 &&
      (phoneDigits.endsWith(stored) ||
        stored.endsWith(phoneDigits) ||
        phoneDigits.startsWith(stored) ||
        stored.startsWith(phoneDigits))
    )
  })
  return byOverlap ?? null
}

function pickLastOrder(
  orders: OrderPublic[],
  customerId: string,
): CustomerLookup['lastOrder'] {
  const order = orders.find((o) => o.customer_id === customerId)
  if (!order) return null
  return {
    id: order.id,
    code: order.code,
    status: order.status,
    createdAt: order.created_at,
  }
}

export async function lookupCustomerByPhone(params: {
  phone: string
  accessToken: string
  organizationId: string
}): Promise<CustomerLookup> {
  const phoneDigits = normalizePhone(params.phone)
  if (!phoneDigits) return EMPTY_CUSTOMER_LOOKUP

  const { accessToken, organizationId } = params

  const [customersPage, ordersPage] = await Promise.all([
    apiRequest<Page<CustomerPublic>>('/customers/seller/', {
      token: accessToken,
      params: {
        organization_id: organizationId,
        phone: phoneDigits,
        page: 1,
        page_size: 20,
      },
    }),
    apiRequest<Page<OrderPublic>>('/orders/seller/', {
      token: accessToken,
      params: {
        organization_id: organizationId,
        search: phoneDigits,
        page: 1,
        page_size: 10,
      },
    }),
  ])

  const customer = pickCustomer(customersPage.items, phoneDigits)
  if (!customer) return EMPTY_CUSTOMER_LOOKUP

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
    },
    address: customer.address?.address ?? null,
    lastOrder: pickLastOrder(ordersPage.items, customer.id),
  }
}
