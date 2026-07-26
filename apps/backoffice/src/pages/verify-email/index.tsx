import {
  formatApiError,
  useVerifyEmailEndpointUsersVerifyEmailPost,
} from '@broker/api'
import { VerifyEmailCard, type VerifyEmailStatus } from '@broker/ui'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const verifyMutation = useVerifyEmailEndpointUsersVerifyEmailPost()
  const started = useRef(false)
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
        setMessage('Correo confirmado correctamente. Ya puedes iniciar sesión.')
      })
      .catch((error: unknown) => {
        setStatus('error')
        setMessage(formatApiError(error, 'El enlace no es válido o ha caducado.'))
      })
  }, [token, verifyMutation])

  return <VerifyEmailCard status={status} message={message} />
}
