import { apiRequest } from './http'
import type { SellerOrganization, SessionUser } from './types'

export async function loginRequest(
  email: string,
  password: string,
): Promise<string> {
  const data = await apiRequest<{ access_token: string }>('/users/login', {
    method: 'POST',
    body: { email, password },
  })
  return data.access_token
}

export async function fetchMe(accessToken: string): Promise<SessionUser> {
  const data = await apiRequest<{
    id: string
    name: string
    email: string
    phone?: string | null
  }>('/users/me', { token: accessToken })
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
  }
}

export async function refreshAccessToken(accessToken: string): Promise<string> {
  const data = await apiRequest<{ access_token: string }>('/users/refresh', {
    method: 'POST',
    token: accessToken,
  })
  return data.access_token
}

type OrgApi = {
  id: string
  name: string
  type: string
}

export async function fetchSellerOrganizations(
  accessToken: string,
): Promise<SellerOrganization[]> {
  const data = await apiRequest<OrgApi[]>('/users/my-organizations', {
    token: accessToken,
  })
  return data
    .filter((org) => org.type === 'seller')
    .map((org) => ({ id: org.id, name: org.name }))
}
