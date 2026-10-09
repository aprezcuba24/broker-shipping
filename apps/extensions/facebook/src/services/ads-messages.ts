import { apiRequest } from '@broker/extension-auth'
import type { AdsMessageSummary } from '../auth/types'

type AdsMessagePage = {
  items: Array<{
    id: string
    title: string
    description: string
    code: string
    photo_url?: string | null
  }>
}

export async function listSellerAdsMessages(params: {
  accessToken: string
  organizationId: string
}): Promise<AdsMessageSummary[]> {
  const page = await apiRequest<AdsMessagePage>('/facebook/ads-messages/', {
    token: params.accessToken,
    params: {
      organization_id: params.organizationId,
      page: 1,
      page_size: 100,
    },
  })

  return page.items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    code: item.code,
    photo_url: item.photo_url ?? null,
  }))
}
