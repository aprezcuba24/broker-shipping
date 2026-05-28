import { configureApi, useAuth } from '@broker/api'
import {
  createContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { useActiveOrganization } from './active-organization-context'

const AuthContext = createContext<null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const { activeOrganization } = useActiveOrganization()
  const activeOrganizationId = activeOrganization?.id ?? null

  const tokenRef = useRef(token)
  const activeOrganizationIdRef = useRef<string | null>(null)

  tokenRef.current = token
  activeOrganizationIdRef.current = activeOrganizationId

  useEffect(() => {
    configureApi({
      baseUrl: import.meta.env.VITE_API_URL,
      getToken: () => tokenRef.current,
      getOrganizationId: () => activeOrganizationIdRef.current,
    })
  }, [token, activeOrganizationId])

  return <AuthContext value={null}>{children}</AuthContext>
}
