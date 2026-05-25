import type { ReactNode } from 'react'
import type { UserPublic } from '../generated/models/userPublic'
import type { LoginFormValues } from './login-schema'
import type { AuthStorage } from './storage'

export type AuthContextValue = {
  token: string | null
  user: UserPublic | null
  isAuthenticated: boolean
  isLoading: boolean
  isLoggingIn: boolean
  loginError: string | null
  login: (values: LoginFormValues) => Promise<void>
  logout: () => void
}

export type AuthProviderProps = {
  storage: AuthStorage
  baseUrl?: string
  children: ReactNode
}

export type { AuthStorage }
