import type { SellerOrganization, SessionUser } from '../auth/types'
import { apiRequest } from './http'

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
  const data = await apiRequest<{ id: string; name: string; email: string }>(
    '/users/me',
    { token: accessToken },
  )
  return { id: data.id, name: data.name, email: data.email }
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
