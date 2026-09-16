import { configureApi, useAuth } from '@broker/api'
import { createContext, useRef, type ReactNode } from 'react'
import { useActiveOrganization } from './active-organization-context'

const OrganizationScopedApiContext = createContext<null>(null)

export function OrganizationScopedApiProvider({
  children,
  baseUrl,
}: {
  children: ReactNode
  baseUrl?: string
}) {
  const { token } = useAuth()
  const { activeOrganization } = useActiveOrganization()
  const activeOrganizationId = activeOrganization?.id ?? null

  const tokenRef = useRef(token)
  const activeOrganizationIdRef = useRef<string | null>(null)

  // Sync before children render so tenant-scoped fetches see organization_id / baseUrl
  // on the first tick (useEffect would race child queries).
  tokenRef.current = token
  activeOrganizationIdRef.current = activeOrganizationId
  configureApi({
    ...(baseUrl !== undefined ? { baseUrl } : {}),
    getToken: () => tokenRef.current,
    getOrganizationId: () => activeOrganizationIdRef.current,
  })

  return <OrganizationScopedApiContext value={null}>{children}</OrganizationScopedApiContext>
}
