export { brokerFetch, configureApi, type ApiAuthConfig } from './client'
export { formatApiError } from './lib/format-api-error'
export { formatDateTime } from './lib/utils'

export { loginSchema, type LoginFormValues } from './auth/login-schema'
export {
  registerSchema,
  clientAppSchema,
  EMAIL_NOT_VERIFIED_DETAIL,
  isEmailNotVerifiedError,
  type RegisterFormValues,
  type ClientApp,
} from './auth/register-schema'
export { AuthProvider, useAuth } from './auth/auth-context'
export { RequireAuth } from './auth/require-auth'
export { createLocalStorageAuthStorage } from './auth/storage'
export type { AuthContextValue, AuthProviderProps } from './auth/types'
export type { AuthStorage } from './auth/storage'

export * from './generated/default/default'
export * from './generated/models'
export * from './generated/users/users'
export * from './generated/products/products'
export * from './generated/organizations/organizations'
export * from './generated/api-keys/api-keys'
export * from './generated/health/health'
export * from './generated/demo/demo'
