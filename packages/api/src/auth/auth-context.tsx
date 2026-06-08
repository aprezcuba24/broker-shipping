import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { configureApi } from '../client'
import {
  getMeUsersMeGetQueryKey,
  useLoginUsersLoginPost,
  useMeUsersMeGet,
} from '../generated/users/users'
import { formatApiError } from '../lib/format-api-error'
import type { LoginFormValues } from './login-schema'
import type { AuthContextValue, AuthProviderProps } from './types'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ storage, baseUrl, appType, children }: AuthProviderProps) {
  const queryClient = useQueryClient()
  const tokenRef = useRef<string | null>(storage.getToken())
  const [token, setToken] = useState<string | null>(() => storage.getToken())

  const syncApiConfig = useCallback(() => {
    configureApi({
      baseUrl,
      getToken: () => tokenRef.current,
    })
  }, [baseUrl])

  useEffect(() => {
    syncApiConfig()
  }, [syncApiConfig, token])

  const meQuery = useMeUsersMeGet({
    query: {
      enabled: Boolean(token),
      retry: false,
    },
  })

  useEffect(() => {
    if (!meQuery.isError || !token) {
      return
    }
    tokenRef.current = null
    setToken(null)
    storage.setToken(null)
    void queryClient.removeQueries({ queryKey: getMeUsersMeGetQueryKey() })
  }, [meQuery.isError, token, storage, queryClient])

  const loginMutation = useLoginUsersLoginPost({
    request: {
      headers: { app_type: appType },
    },
  })

  const login = useCallback(
    async (values: LoginFormValues) => {
      loginMutation.reset()
      const response = await loginMutation.mutateAsync({ data: values })
      tokenRef.current = response.access_token
      setToken(response.access_token)
      storage.setToken(response.access_token)
      await queryClient.invalidateQueries({ queryKey: getMeUsersMeGetQueryKey() })
    },
    [loginMutation, queryClient, storage],
  )

  const logout = useCallback(() => {
    tokenRef.current = null
    setToken(null)
    storage.setToken(null)
    loginMutation.reset()
    void queryClient.removeQueries({ queryKey: getMeUsersMeGetQueryKey() })
  }, [loginMutation, queryClient, storage])

  const isLoading = Boolean(token) && meQuery.isPending
  const user = meQuery.data ?? null
  const isAuthenticated = Boolean(token && user && !meQuery.isError)

  const loginError = loginMutation.isError
    ? formatApiError(
        loginMutation.error,
        'No se pudo iniciar sesión. Comprueba tus credenciales.',
      )
    : null

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated,
      isLoading,
      isLoggingIn: loginMutation.isPending,
      loginError,
      login,
      logout,
    }),
    [
      token,
      user,
      isAuthenticated,
      isLoading,
      loginMutation.isPending,
      loginError,
      login,
      logout,
    ],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
