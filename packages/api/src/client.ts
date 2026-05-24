export type ApiAuthConfig = {
  baseUrl?: string
  getToken?: () => string | null
  getApiKey?: () => string | null
  getOrganizationId?: () => string | null
}

const DEFAULT_BASE_URL = 'http://localhost:8000'

let authConfig: ApiAuthConfig = { baseUrl: DEFAULT_BASE_URL }

export function configureApi(config: ApiAuthConfig): void {
  authConfig = { baseUrl: DEFAULT_BASE_URL, ...config }
}

function getBaseUrl(): string {
  return authConfig.baseUrl ?? DEFAULT_BASE_URL
}

export async function brokerFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const headers = new Headers(options?.headers)

  const token = authConfig.getToken?.()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const apiKey = authConfig.getApiKey?.()
  if (apiKey) {
    headers.set('X-API-Key', apiKey)
  }

  const organizationId = authConfig.getOrganizationId?.()
  if (organizationId) {
    headers.set('X-Organization-Id', organizationId)
  }

  const res = await fetch(`${getBaseUrl()}${url}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    let detail: unknown = res.statusText
    try {
      detail = await res.json()
    } catch {
      /* empty body */
    }
    throw detail
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json() as Promise<T>
}
