import {
  formatApiError,
  getMyOrganizationsUsersMyOrganizationsGetQueryKey,
  useAcceptInvitationByTokenOrganizationsInvitationsAcceptByTokenPost,
  useAuth,
} from '@broker/api'
import {
  peekInviteToken,
  storeInviteToken,
  takeInviteToken,
  notify,
  type AcceptInvitationStatus,
} from '@broker/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useAcceptInvitation() {
  const [searchParams] = useSearchParams()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const acceptMutation = useAcceptInvitationByTokenOrganizationsInvitationsAcceptByTokenPost()
  const [status, setStatus] = useState<AcceptInvitationStatus>('loading')
  const [message, setMessage] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const runAccept = useCallback(async () => {
    const fromUrl = searchParams.get('token')
    if (fromUrl) {
      storeInviteToken(fromUrl)
    }
    const token = fromUrl ?? peekInviteToken()
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
      setStatus('needs-auth')
      return
    }

    setStatus('loading')
    setMessage(null)
    try {
      await acceptMutation.mutateAsync({ data: { token } })
      takeInviteToken()
      await queryClient.invalidateQueries({
        queryKey: getMyOrganizationsUsersMyOrganizationsGetQueryKey(),
      })
      setStatus('success')
      setMessage('Ya formas parte de la organización.')
      notify.success('Invitación aceptada')
    } catch (error) {
      setStatus('error')
      setMessage(formatApiError(error, 'No se pudo aceptar la invitación.'))
    }
  }, [acceptMutation, authLoading, isAuthenticated, queryClient, searchParams])

  useEffect(() => {
    void runAccept()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run on attempt / auth
  }, [attempt, authLoading, isAuthenticated])

  return {
    status,
    message,
    retry: () => setAttempt((n) => n + 1),
  }
}
