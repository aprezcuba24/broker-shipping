import { normalizePhone } from '../phone'
import { apiRequest } from './http'
import {
  EMPTY_CUSTOMER_LOOKUP,
  type CustomerLookup,
  type CustomerPublic,
  type LastOrder,
  type MunicipalityPublic,
  type OrderPublic,
  type OrganizationPublic,
  type Page,
  type ProductPublic,
  type ProvincePublic,
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

async function fetchProductName(
  token: string,
  organizationId: string,
  productId: string,
): Promise<string | null> {
  try {
    const product = await apiRequest<ProductPublic>(
      `/products/seller/${productId}`,
      {
        token,
        params: { organization_id: organizationId },
      },
    )
    return product.name
  } catch {
    return null
  }
}

async function loadProviderNames(
  token: string,
  organizationId: string,
): Promise<Map<string, string>> {
  try {
    const providers = await apiRequest<OrganizationPublic[]>(
      '/organizations/seller/providers',
      {
        token,
        params: { organization_id: organizationId },
      },
    )
    return new Map(providers.map((p) => [p.id, p.name]))
  } catch {
    return new Map()
  }
}

async function enrichLastOrder(
  order: OrderPublic,
  token: string,
  organizationId: string,
): Promise<LastOrder> {
  const items = order.items ?? []
  const productIds = [...new Set(items.map((item) => item.product_id))]

  const [productNames, providerNames] = await Promise.all([
    Promise.all(
      productIds.map(async (id) => {
        const name = await fetchProductName(token, organizationId, id)
        return [id, name] as const
      }),
    ),
    loadProviderNames(token, organizationId),
  ])

  const productNameById = new Map(productNames)

  return {
    id: order.id,
    code: order.code,
    status: order.status,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    totals: order.totals ?? [],
    items: items.map((item) => ({
      id: item.id,
      productId: item.product_id,
      productName: productNameById.get(item.product_id) ?? null,
      providerOrganizationId: item.provider_organization_id,
      providerName: providerNames.get(item.provider_organization_id) ?? null,
      quantity: item.quantity,
      currency: item.currency,
      unitPrice: item.seller_provider_price,
      commission: item.seller_commission,
      customerChange: item.customer_change,
      status: item.status,
    })),
  }
}

function pickLastOrder(
  orders: OrderPublic[],
  customerId: string,
): OrderPublic | null {
  return orders.find((o) => o.customer_id === customerId) ?? null
}

let provincesCache: ProvincePublic[] | null = null
let provincesCachePromise: Promise<ProvincePublic[]> | null = null

async function loadProvinces(token: string): Promise<ProvincePublic[]> {
  if (provincesCache) return provincesCache
  if (!provincesCachePromise) {
    provincesCachePromise = apiRequest<ProvincePublic[]>('/locations/provinces', {
      token,
    })
      .then((provinces) => {
        provincesCache = provinces
        return provinces
      })
      .catch((err) => {
        provincesCachePromise = null
        throw err
      })
  }
  return provincesCachePromise
}

async function resolveLocationNames(
  token: string,
  address: CustomerPublic['address'],
): Promise<{ province: string | null; municipality: string | null }> {
  if (!address) return { province: null, municipality: null }

  try {
    const [provinces, municipalities] = await Promise.all([
      loadProvinces(token),
      apiRequest<MunicipalityPublic[]>(
        `/locations/provinces/${address.province_id}/municipalities`,
        { token },
      ),
    ])
    return {
      province: provinces.find((p) => p.id === address.province_id)?.name ?? null,
      municipality:
        municipalities.find((m) => m.id === address.municipality_id)?.name ?? null,
    }
  } catch {
    return { province: null, municipality: null }
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

  const rawLastOrder = pickLastOrder(ordersPage.items, customer.id)

  const [{ province, municipality }, lastOrder] = await Promise.all([
    resolveLocationNames(accessToken, customer.address),
    rawLastOrder
      ? enrichLastOrder(rawLastOrder, accessToken, organizationId)
      : Promise.resolve(null),
  ])

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      ci: customer.ci,
    },
    address: customer.address?.address ?? null,
    province,
    municipality,
    lastOrder,
  }
}
