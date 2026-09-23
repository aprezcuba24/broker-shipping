export type AddressPublic = {
  id: string
  address: string
  province_id: string
  municipality_id: string
  customer_id: string
  created_at: string
  updated_at: string | null
}

export type CustomerPublic = {
  id: string
  name: string
  ci: string
  phone: string
  seller_organization_id: string
  created_at: string
  updated_at: string | null
  address?: AddressPublic | null
}

export type OrderItemPublic = {
  id: string
  order_id: string
  product_id: string
  provider_organization_id: string
  unit_provider_price: number
  seller_provider_price: number
  customer_change: number
  quantity: number
  currency: string
  status: string
  seller_commission: number
  created_at: string
  updated_at: string | null
}

export type OrderCurrencyTotal = {
  currency: string
  amount: number
}

export type OrderPublic = {
  id: string
  code: string
  seller_organization_id: string
  customer_id: string
  status: string
  created_at: string
  updated_at: string | null
  items?: OrderItemPublic[]
  totals?: OrderCurrencyTotal[]
  customer?: CustomerPublic | null
}

export type ProductPublic = {
  id: string
  name: string
}

export type OrganizationPublic = {
  id: string
  name: string
}

export type Page<T> = {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export type ProvincePublic = {
  id: string
  name: string
}

export type MunicipalityPublic = {
  id: string
  name: string
  province_id: string
}

export type LastOrderItem = {
  id: string
  productId: string
  productName: string | null
  providerOrganizationId: string
  providerName: string | null
  quantity: number
  currency: string
  unitPrice: number
  commission: number
  customerChange: number
  status: string
}

export type LastOrder = {
  id: string
  code: string
  status: string
  createdAt: string
  updatedAt: string | null
  totals: OrderCurrencyTotal[]
  items: LastOrderItem[]
}

export type CustomerLookup = {
  customer: { id: string; name: string; phone: string; ci: string } | null
  address: string | null
  province: string | null
  municipality: string | null
  lastOrder: LastOrder | null
}

export const EMPTY_CUSTOMER_LOOKUP: CustomerLookup = {
  customer: null,
  address: null,
  province: null,
  municipality: null,
  lastOrder: null,
}
