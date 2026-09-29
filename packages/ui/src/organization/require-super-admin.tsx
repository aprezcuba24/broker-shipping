import { useAuth } from '@broker/api'
import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { PageLoading } from '../components/page-loading'

export type RequireSuperAdminProps = {
  children: ReactNode
  fallbackPath?: string
}

export function RequireSuperAdmin({
  children,
  fallbackPath = '/',
}: RequireSuperAdminProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <PageLoading title="Cargando…" />
  }

  if (!user?.is_super_admin) {
    return <Navigate to={fallbackPath} replace />
  }

  return children
}
