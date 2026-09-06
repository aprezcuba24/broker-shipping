import { useGetInviteProviderOrganizationsSellerInviteProvidersProviderOrganizationIdGet } from '@broker/api'
import { peekJoinProviderId, storeJoinProviderId } from '@broker/ui'
import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/** Persist and resolve the provider from an invite link across auth/onboarding. */
export function usePendingJoinProvider() {
  const [searchParams] = useSearchParams()
  const fromUrl = searchParams.get('provider_id')?.trim() || null
  const providerId = fromUrl ?? peekJoinProviderId()

  useEffect(() => {
    if (fromUrl) {
      storeJoinProviderId(fromUrl)
    }
  }, [fromUrl])

  const providerQuery =
    useGetInviteProviderOrganizationsSellerInviteProvidersProviderOrganizationIdGet(
      providerId ?? '',
      {
        query: {
          enabled: Boolean(providerId),
          retry: false,
        },
      },
    )

  const withProviderQuery = useMemo(() => {
    if (!providerId) return ''
    return `provider_id=${encodeURIComponent(providerId)}`
  }, [providerId])

  return {
    providerId,
    providerName: providerQuery.data?.name ?? null,
    isLoadingProvider: Boolean(providerId) && providerQuery.isPending,
    withProviderQuery,
    joinProviderPath: providerId
      ? `/join-provider?provider_id=${encodeURIComponent(providerId)}`
      : '/join-provider',
    loginPath: withProviderQuery ? `/login?${withProviderQuery}` : '/login',
    registerPath: withProviderQuery ? `/register?${withProviderQuery}` : '/register',
    onboardingPath: withProviderQuery
      ? `/onboarding?${withProviderQuery}`
      : '/onboarding',
    verifiedLoginPath: withProviderQuery
      ? `/login?verified=1&${withProviderQuery}`
      : '/login?verified=1',
  }
}
