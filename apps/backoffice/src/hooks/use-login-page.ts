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

export function useLoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, isLoggingIn, loginError, isEmailNotVerified } = useAuth()
  const resendMutation = useResendVerificationUsersResendVerificationPost()
  const [lastEmail, setLastEmail] = useState('')
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  const verified = searchParams.get('verified') === '1'
  const showResend = Boolean(isEmailNotVerified && lastEmail)

  const onSubmit = async (values: LoginFormValues) => {
    setLastEmail(values.email)
    setResendMessage(null)
    await login(values)
    if (peekInviteToken()) {
      void navigate('/accept-invitation')
      return
    }
    void navigate('/')
  }

  const onResend = async () => {
    setResendMessage(null)
    try {
      await resendMutation.mutateAsync({
        data: { email: lastEmail, client_app: 'backoffice' },
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
