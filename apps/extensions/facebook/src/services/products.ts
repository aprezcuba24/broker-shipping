import { apiRequest } from '@broker/extension-auth'
import type { ProductSummary } from '../auth/types'

type MoneyDto = {
  amount: number
  currency: string
}

type ProductPage = {
  items: Array<{
    id: string
    name: string
    public_code: string
    description?: string | null
    image_url?: string | null
    price?: MoneyDto | null
    sale_price?: MoneyDto | null
  }>
}

export async function searchSellerProducts(params: {
  accessToken: string
  organizationId: string
  query: string
}): Promise<ProductSummary[]> {
  const page = await apiRequest<ProductPage>('/products/seller/', {
    token: params.accessToken,
      params: {
        organization_id: params.organizationId,
        name: params.query.trim() || undefined,
        page: 1,
        page_size: 20,
      },
  })

  return page.items.map((item) => ({
    id: item.id,
    name: item.name,
    public_code: item.public_code,
    description: item.description ?? null,
    image_url: item.image_url ?? null,
    price: item.price ?? null,
    sale_price: item.sale_price ?? null,
  }))
}
