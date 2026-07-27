import {
  formatApiError,
  getMyOrganizationsUsersMyOrganizationsGetQueryKey,
  useAcceptInvitationByTokenOrganizationsInvitationsAcceptByTokenPost,
  useAuth,
  useMyOrganizationsUsersMyOrganizationsGet,
  OrganizationType,
} from '@broker/api'
import {
  AcceptInvitationCard,
  peekInviteToken,
  storeInviteToken,
  takeInviteToken,
  type AcceptInvitationStatus,
} from '@broker/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export function AcceptInvitationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, isLoading: authLoading, token: authToken } = useAuth()
  const queryClient = useQueryClient()
  const orgsQuery = useMyOrganizationsUsersMyOrganizationsGet({
    query: { enabled: Boolean(authToken) },
  })
  const acceptMutation = useAcceptInvitationByTokenOrganizationsInvitationsAcceptByTokenPost()
  const [status, setStatus] = useState<AcceptInvitationStatus>('loading')
  const [message, setMessage] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const runAccept = useCallback(async () => {
    const fromUrl = searchParams.get('token')
    if (fromUrl) {
      storeInviteToken(fromUrl)
    }
    const inviteToken = fromUrl ?? peekInviteToken()
    if (!inviteToken) {
      setStatus('error')
      setMessage('Falta el token de invitación.')
      return
    }

    if (authLoading || (isAuthenticated && orgsQuery.isPending)) {
      setStatus('loading')
      return
    }

    if (!isAuthenticated) {
      storeInviteToken(inviteToken)
      setStatus('needs-auth')
      return
    }

    const sellerOrgs = (orgsQuery.data ?? []).filter((o) => o.type === OrganizationType.seller)
    if (sellerOrgs.length === 0) {
      storeInviteToken(inviteToken)
      setStatus('needs-org')
      return
    }

    setStatus('loading')
    setMessage(null)
    try {
      await acceptMutation.mutateAsync({
        data: {
          token: inviteToken,
          seller_organization_id: sellerOrgs[0].id,
        },
      })
      takeInviteToken()
      await queryClient.invalidateQueries({
        queryKey: getMyOrganizationsUsersMyOrganizationsGetQueryKey(),
      })
      setStatus('success')
      setMessage('Enlace comercial establecido con el proveedor.')
    } catch (error) {
      // member_invite does not need seller_organization_id — retry without it
      try {
        await acceptMutation.mutateAsync({ data: { token: inviteToken } })
        takeInviteToken()
        await queryClient.invalidateQueries({
          queryKey: getMyOrganizationsUsersMyOrganizationsGetQueryKey(),
        })
        setStatus('success')
        setMessage('Ya formas parte de la organización.')
      } catch (inner) {
        setStatus('error')
        setMessage(formatApiError(inner, formatApiError(error, 'No se pudo aceptar la invitación.')))
      }
    }
  }, [
    acceptMutation,
    authLoading,
    isAuthenticated,
    orgsQuery.data,
    orgsQuery.isPending,
    queryClient,
    searchParams,
  ])

  useEffect(() => {
    void runAccept()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, authLoading, isAuthenticated, orgsQuery.isPending, orgsQuery.data])

  return (
    <AcceptInvitationCard
      status={status}
      message={message}
      onRetry={() => setAttempt((n) => n + 1)}
      onGoHome={() => void navigate('/')}
      onGoLogin={() => void navigate('/login')}
      onGoOnboarding={() => void navigate('/onboarding')}
    />
  )
}
