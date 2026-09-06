import {
  formatApiError,
  useAuth,
  useCreateSellerLinkRequestOrganizationsSellerOrganizationIdSellerLinkRequestsPost,
  useGetInviteProviderOrganizationsSellerInviteProvidersProviderOrganizationIdGet,
} from '@broker/api'
import {
  peekJoinProviderId,
  storeJoinProviderId,
  takeJoinProviderId,
  useActiveOrganization,
  notify,
  type JoinProviderStatus,
} from '@broker/ui'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export function useJoinProvider() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { organizations, activeOrganization, isLoading: orgsLoading } =
    useActiveOrganization()
  const createMutation =
    useCreateSellerLinkRequestOrganizationsSellerOrganizationIdSellerLinkRequestsPost()
  const autoRequested = useRef(false)

  const fromUrl = searchParams.get('provider_id')
  const providerId = fromUrl ?? peekJoinProviderId() ?? ''

  const loginPath = useMemo(
    () =>
      providerId ? `/login?provider_id=${encodeURIComponent(providerId)}` : '/login',
    [providerId],
  )
  const registerPath = useMemo(
    () =>
      providerId
        ? `/register?provider_id=${encodeURIComponent(providerId)}`
        : '/register',
    [providerId],
  )
  const onboardingPath = useMemo(
    () =>
      providerId
        ? `/onboarding?provider_id=${encodeURIComponent(providerId)}`
        : '/onboarding',
    [providerId],
  )

  useEffect(() => {
    if (fromUrl) {
      storeJoinProviderId(fromUrl)
    }
  }, [fromUrl])

  const providerQuery =
    useGetInviteProviderOrganizationsSellerInviteProvidersProviderOrganizationIdGet(
      providerId,
      {
        query: {
          enabled: Boolean(providerId),
          retry: false,
        },
      },
    )

  const [status, setStatus] = useState<JoinProviderStatus>('loading')
  const [message, setMessage] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const requestLink = useCallback(async () => {
    if (!providerId || !activeOrganization?.id) return
    setStatus('submitting')
    setMessage(null)
    try {
      await createMutation.mutateAsync({
        organizationId: providerId,
        params: { seller_organization_id: activeOrganization.id },
      })
      takeJoinProviderId()
      notify.success('Solicitud enviada')
      setStatus('success')
      void navigate('/providers?tab=pending', { replace: true })
    } catch (error) {
      autoRequested.current = false
      setStatus('error')
      setMessage(formatApiError(error, 'No se pudo enviar la solicitud.'))
    }
  }, [activeOrganization?.id, createMutation, navigate, providerId])

  useEffect(() => {
    if (!providerId) {
      setStatus('error')
      setMessage('Falta el identificador del proveedor en el enlace.')
      return
    }

    if (providerQuery.isPending) {
      setStatus('loading')
      return
    }

    if (providerQuery.isError) {
      setStatus('error')
      setMessage(
        formatApiError(
          providerQuery.error,
          'No encontramos este proveedor. El enlace puede ser inválido.',
        ),
      )
      return
    }

    if (authLoading) {
      setStatus('loading')
      return
    }

    if (!isAuthenticated) {
      setStatus('needs-auth')
      setMessage(null)
      return
    }

    if (orgsLoading) {
      setStatus('loading')
      return
    }

    if (organizations.length === 0) {
      setStatus('needs-org')
      setMessage(null)
      void navigate(onboardingPath, { replace: true })
      return
    }

    if (!activeOrganization?.id) {
      setStatus('loading')
      return
    }

    if (autoRequested.current) {
      return
    }
    autoRequested.current = true
    void requestLink()
  }, [
    activeOrganization?.id,
    attempt,
    authLoading,
    isAuthenticated,
    navigate,
    onboardingPath,
    organizations.length,
    orgsLoading,
    providerId,
    providerQuery.error,
    providerQuery.isError,
    providerQuery.isPending,
    requestLink,
  ])

  return {
    status,
    message,
    providerName: providerQuery.data?.name ?? null,
    loginPath,
    registerPath,
    onboardingPath,
    retry: () => {
      autoRequested.current = false
      setAttempt((n) => n + 1)
    },
  }
}
