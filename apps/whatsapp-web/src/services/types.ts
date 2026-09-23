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

export type OrderPublic = {
  id: string
  code: string
  seller_organization_id: string
  customer_id: string
  status: string
  created_at: string
  updated_at: string | null
  customer?: CustomerPublic | null
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

export type CustomerLookup = {
  customer: { id: string; name: string; phone: string; ci: string } | null
  address: string | null
  province: string | null
  municipality: string | null
  lastOrder: {
    id: string
    code: string
    status: string
    createdAt: string
  } | null
}

export const EMPTY_CUSTOMER_LOOKUP: CustomerLookup = {
  customer: null,
  address: null,
  province: null,
  municipality: null,
  lastOrder: null,
}
