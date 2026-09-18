import {
  formatApiError,
  getMyOrganizationsUsersMyOrganizationsGetQueryKey,
  useAcceptInvitationByTokenOrganizationsInvitationsAcceptByTokenPost,
  useAuth,
} from '@broker/api'
import {
  clearInviteMeta,
  notify,
  peekInviteToken,
  storeInviteMeta,
  storeInviteToken,
  storePreferredOrganizationId,
  takeInviteToken,
  usePendingMemberInvite,
  type AcceptInvitationStatus,
} from '@broker/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export function useAcceptInvitation() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const acceptMutation = useAcceptInvitationByTokenOrganizationsInvitationsAcceptByTokenPost()
  const [status, setStatus] = useState<AcceptInvitationStatus>('loading')
  const [message, setMessage] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const {
    token: pendingToken,
    organizationName,
    inviteeEmail,
    userExists,
    isLoadingPreview,
    isPreviewError,
    previewError,
    loginPath,
    registerPath,
  } = usePendingMemberInvite()

  const runAccept = useCallback(async () => {
    const fromUrl = searchParams.get('token')?.trim() || null
    if (fromUrl) {
      storeInviteToken(fromUrl)
    }
    const token = fromUrl ?? peekInviteToken() ?? pendingToken
    if (!token) {
      setStatus('error')
      setMessage('Falta el token de invitación.')
      return
    }

    if (authLoading) {
      setStatus('loading')
      return
    }

    if (!isAuthenticated) {
      storeInviteToken(token)
      if (isLoadingPreview) {
        setStatus('loading')
        setMessage('Comprobando tu invitación…')
        return
      }
      if (isPreviewError) {
        setStatus('error')
        setMessage(
          formatApiError(previewError, 'La invitación no es válida o ya no está pendiente.'),
        )
        return
      }
      if (userExists === null) {
        setStatus('loading')
        return
      }
      if (organizationName && inviteeEmail) {
        storeInviteMeta({ organizationName, inviteeEmail })
      }
      void navigate(userExists ? loginPath : registerPath, { replace: true })
      return
    }

    setStatus('loading')
    setMessage(null)
    try {
      const membership = await acceptMutation.mutateAsync({ data: { token } })
      takeInviteToken()
      clearInviteMeta()
      storePreferredOrganizationId(membership.organization_id)
      await queryClient.invalidateQueries({
        queryKey: getMyOrganizationsUsersMyOrganizationsGetQueryKey(),
      })
      setStatus('success')
      setMessage(
        organizationName
          ? `Ya formas parte de ${organizationName}.`
          : 'Ya formas parte de la organización.',
      )
      notify.success('Invitación aceptada')
    } catch (error) {
      setStatus('error')
      setMessage(formatApiError(error, 'No se pudo aceptar la invitación.'))
    }
  }, [
    acceptMutation,
    authLoading,
    inviteeEmail,
    isAuthenticated,
    isLoadingPreview,
    isPreviewError,
    loginPath,
    navigate,
    organizationName,
    pendingToken,
    previewError,
    queryClient,
    registerPath,
    searchParams,
    userExists,
  ])

  useEffect(() => {
    void runAccept()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run on attempt / auth / preview
  }, [
    attempt,
    authLoading,
    isAuthenticated,
    isLoadingPreview,
    isPreviewError,
    userExists,
  ])

  return {
    status,
    message,
    retry: () => setAttempt((n) => n + 1),
  }
}
