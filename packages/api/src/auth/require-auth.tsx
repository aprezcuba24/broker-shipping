import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './auth-context'

export type RequireAuthProps = {
  loginPath: string
  children: ReactNode
}

export function RequireAuth({ loginPath, children }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace />
  }

  return children
}
