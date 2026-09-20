import { API_BASE_URL } from './constants'
import type { SellerOrganization, SessionUser } from './types'

type ApiErrorBody = {
  detail?: string | { msg?: string }[]
}

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody
    if (typeof body.detail === 'string') {
      if (body.detail === 'Email not verified') {
        return 'Debes confirmar tu correo antes de iniciar sesión'
      }
      if (body.detail === 'Invalid credentials') {
        return 'Credenciales inválidas'
      }
      return body.detail
    }
    if (Array.isArray(body.detail) && body.detail[0]?.msg) {
      return body.detail[0].msg
    }
  } catch {
    // ignore
  }
  if (response.status === 401) return 'Credenciales inválidas'
  if (response.status === 403) return 'Debes confirmar tu correo antes de iniciar sesión'
  return `Error ${response.status}`
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  const data = (await response.json()) as { access_token: string }
  return data.access_token
}

export async function fetchMe(accessToken: string): Promise<SessionUser> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  const data = (await response.json()) as {
    id: string
    name: string
    email: string
  }
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
  const response = await fetch(`${API_BASE_URL}/users/my-organizations`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  const data = (await response.json()) as OrgApi[]
  return data
    .filter((org) => org.type === 'seller')
    .map((org) => ({ id: org.id, name: org.name }))
}
