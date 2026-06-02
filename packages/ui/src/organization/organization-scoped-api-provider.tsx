import { configureApi, useAuth } from '@broker/api'
import {
  createContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
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

  tokenRef.current = token
  activeOrganizationIdRef.current = activeOrganizationId

  useEffect(() => {
    configureApi({
      ...(baseUrl !== undefined ? { baseUrl } : {}),
      getToken: () => tokenRef.current,
      getOrganizationId: () => activeOrganizationIdRef.current,
    })
  }, [baseUrl, token, activeOrganizationId])

  return (
    <OrganizationScopedApiContext value={null}>{children}</OrganizationScopedApiContext>
  )
}
