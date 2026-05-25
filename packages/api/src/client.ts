export type ApiAuthConfig = {
  baseUrl?: string
  getToken?: () => string | null
  getApiKey?: () => string | null
  getOrganizationId?: () => string | null
}

export type BrokerFetchConfig = {
  url: string
  method: string
  headers?: Record<string, string>
  data?: unknown
  params?: Record<string, string>
  signal?: AbortSignal
}

const DEFAULT_BASE_URL = 'http://localhost:8000'

let authConfig: ApiAuthConfig = { baseUrl: DEFAULT_BASE_URL }

export function configureApi(config: ApiAuthConfig): void {
  authConfig = { baseUrl: DEFAULT_BASE_URL, ...config }
}

function getBaseUrl(): string {
  return authConfig.baseUrl ?? DEFAULT_BASE_URL
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, getBaseUrl())
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }
  return url.toString()
}

export async function brokerFetch<T>(
  config: BrokerFetchConfig,
  options?: RequestInit,
): Promise<T> {
  const headers = new Headers(config.headers)

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

  if (options?.headers) {
    const extra = new Headers(options.headers)
    extra.forEach((value, key) => {
      headers.set(key, value)
    })
  }

  const hasBody = config.data !== undefined && config.data !== null
  const body =
    hasBody && headers.get('Content-Type')?.includes('application/json')
      ? JSON.stringify(config.data)
      : hasBody
        ? (config.data as BodyInit)
        : undefined

  const res = await fetch(buildUrl(config.url, config.params), {
    ...options,
    method: config.method,
    headers,
    body,
    signal: config.signal ?? options?.signal,
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
