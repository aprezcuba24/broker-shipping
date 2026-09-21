export const API_BASE_URL = String(
  import.meta.env.VITE_API_URL || 'http://localhost:8000',
).replace(/\/$/, '')

type ApiErrorBody = {
  detail?: string | { msg?: string }[]
}

export async function parseError(response: Response): Promise<string> {
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

export type ApiRequestOptions = {
  method?: string
  token?: string | null
  body?: unknown
  params?: Record<string, string | number | boolean | null | undefined>
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = 'GET', token, body, params } = options
  const url = new URL(path.startsWith('/') ? path.slice(1) : path, `${API_BASE_URL}/`)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) continue
      url.searchParams.set(key, String(value))
    }
  }

  const headers = new Headers()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
