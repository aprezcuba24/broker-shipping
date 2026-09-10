import {
  formatApiError,
  loginSchema,
  useAuth,
  useResendVerificationUsersResendVerificationPost,
  type LoginFormValues,
} from '@broker/api'
import { peekInviteToken } from '@broker/ui'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { usePendingJoinProvider } from '@/hooks/use-pending-join-provider'

export function useLoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, isLoggingIn, loginError, isEmailNotVerified } = useAuth()
  const resendMutation = useResendVerificationUsersResendVerificationPost()
  const [lastEmail, setLastEmail] = useState('')
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const { providerId, providerName, joinProviderPath, registerPath } =
    usePendingJoinProvider()

  const verified = searchParams.get('verified') === '1'
  const showResend = Boolean(isEmailNotVerified && lastEmail)

  const description = providerName
    ? `Inicia sesión para vincularte con ${providerName}.`
    : providerId
      ? 'Inicia sesión para continuar con la solicitud de vínculo.'
      : 'Introduce tus credenciales para continuar.'

  const onSubmit = async (values: LoginFormValues) => {
    setLastEmail(values.email)
    setResendMessage(null)
    await login(values)
    if (peekInviteToken()) {
      void navigate('/accept-invitation')
      return
    }
    if (providerId) {
      void navigate(joinProviderPath)
      return
    }
    void navigate('/')
  }

  const onResend = async () => {
    setResendMessage(null)
    try {
      await resendMutation.mutateAsync({
        data: { email: lastEmail, client_app: 'seller' },
      })
      setResendMessage(
        'Si la cuenta existe y no está verificada, te enviamos un nuevo enlace.',
      )
    } catch (error) {
      setResendMessage(
        formatApiError(error, 'No se pudo reenviar el correo de confirmación.'),
      )
    }
  }

  return {
    schema: loginSchema,
    description,
    registerPath,
    isSubmitting: isLoggingIn,
    error: loginError,
    successMessage:
      resendMessage ??
      (verified ? 'Correo confirmado. Ya puedes iniciar sesión.' : null),
    onSubmit,
    showResend,
    resendPending: resendMutation.isPending,
    onResend,
  }
}
