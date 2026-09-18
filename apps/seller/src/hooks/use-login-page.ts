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
  const [resendDone, setResendDone] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const { providerId, providerName, joinProviderPath, registerPath, withProviderQuery } =
    usePendingJoinProvider()

  const verified = searchParams.get('verified') === '1'
  const reset = searchParams.get('reset') === '1'
  const showResend = Boolean(lastEmail && (isEmailNotVerified || resendDone))

  const description = providerId
    ? 'Inicia sesión para continuar con la solicitud de vínculo.'
    : 'Introduce tus credenciales para continuar.'

  const onSubmit = async (values: LoginFormValues) => {
    setLastEmail(values.email)
    setResendDone(false)
    setResendError(null)
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
    setResendError(null)
    try {
      await resendMutation.mutateAsync({
        data: { email: lastEmail, client_app: 'seller' },
      })
      setResendDone(true)
    } catch (error) {
      setResendDone(false)
      setResendError(
        formatApiError(error, 'No se pudo reenviar el correo de confirmación.'),
      )
    }
  }

  return {
    schema: loginSchema,
    description,
    linkedProviderName: providerName,
    registerPath,
    isSubmitting: isLoggingIn,
    error: resendDone ? null : (resendError ?? loginError),
    successMessage: resendDone
      ? 'Te enviamos un nuevo enlace de confirmación. Revisa tu bandeja de entrada.'
      : verified
        ? 'Correo confirmado. Ya puedes iniciar sesión.'
        : reset
          ? 'Contraseña actualizada. Ya puedes iniciar sesión.'
          : null,
    onSubmit,
    showResend,
    resendPending: resendMutation.isPending,
    onResend,
    forgotPasswordHref: withProviderQuery
      ? `/forgot-password?${withProviderQuery}`
      : '/forgot-password',
  }
}
