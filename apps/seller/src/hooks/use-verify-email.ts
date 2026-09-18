import {
  formatApiError,
  useVerifyEmailEndpointUsersVerifyEmailPost,
} from '@broker/api'
import { peekInviteMeta, peekInviteToken, type VerifyEmailStatus } from '@broker/ui'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { usePendingJoinProvider } from '@/hooks/use-pending-join-provider'

export function useVerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const verifyMutation = useVerifyEmailEndpointUsersVerifyEmailPost()
  const started = useRef(false)
  const inviteToken = peekInviteToken()
  const inviteMeta = peekInviteMeta()
  const { providerName, verifiedLoginPath } = usePendingJoinProvider()

  // Member invite takes precedence over join-provider.
  const loginHref = inviteToken
    ? `/login?verified=1&token=${encodeURIComponent(inviteToken)}`
    : verifiedLoginPath

  const [status, setStatus] = useState<VerifyEmailStatus>(() =>
    token ? 'loading' : 'missing',
  )
  const [message, setMessage] = useState(() =>
    token
      ? 'Un momento, estamos confirmando tu correo…'
      : 'El enlace de confirmación no es válido o está incompleto.',
  )

  useEffect(() => {
    if (!token || started.current) {
      return
    }
    started.current = true
    void verifyMutation
      .mutateAsync({ data: { token } })
      .then(() => {
        setStatus('success')
        if (inviteMeta?.organizationName) {
          setMessage(
            `Correo confirmado. Inicia sesión para unirte a ${inviteMeta.organizationName}.`,
          )
        } else if (providerName) {
          setMessage(
            `Correo confirmado. Inicia sesión para continuar la vinculación con ${providerName}.`,
          )
        } else {
          setMessage('Correo confirmado correctamente. Ya puedes iniciar sesión.')
        }
      })
      .catch((error: unknown) => {
        setStatus('error')
        setMessage(formatApiError(error, 'El enlace no es válido o ha caducado.'))
      })
  }, [inviteMeta?.organizationName, providerName, token, verifyMutation])

  return { status, message, loginHref }
}
