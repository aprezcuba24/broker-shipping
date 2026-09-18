import {
  formatApiError,
  loginSchema,
  useAuth,
  useResendVerificationUsersResendVerificationPost,
  type LoginFormValues,
} from '@broker/api'
import { peekInviteToken, usePendingMemberInvite } from '@broker/ui'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export function useLoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, isLoggingIn, loginError, isEmailNotVerified } = useAuth()
  const resendMutation = useResendVerificationUsersResendVerificationPost()
  const [lastEmail, setLastEmail] = useState('')
  const [resendDone, setResendDone] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const {
    organizationName,
    inviteeEmail,
    registerPath,
    acceptPath,
  } = usePendingMemberInvite()

  const verified = searchParams.get('verified') === '1'
  const reset = searchParams.get('reset') === '1'
  const showResend = Boolean(lastEmail && (isEmailNotVerified || resendDone))

  const description = organizationName
    ? 'Inicia sesión para unirte a la organización.'
    : 'Introduce tus credenciales para continuar.'

  const onSubmit = async (values: LoginFormValues) => {
    setLastEmail(values.email)
    setResendDone(false)
    setResendError(null)
    await login(values)
    if (peekInviteToken()) {
      void navigate(acceptPath)
      return
    }
    void navigate('/')
  }

  const onResend = async () => {
    setResendError(null)
    try {
      await resendMutation.mutateAsync({
        data: { email: lastEmail, client_app: 'backoffice' },
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
    memberInviteOrganizationName: organizationName,
    defaultEmail: inviteeEmail ?? '',
    emailReadOnly: Boolean(inviteeEmail),
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
    forgotPasswordHref: '/forgot-password',
  }
}
