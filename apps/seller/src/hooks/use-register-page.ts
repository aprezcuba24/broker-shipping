import {
  formatApiError,
  registerSchema,
  useRegisterUsersRegisterPost,
  type RegisterFormValues,
} from '@broker/api'
import { useState } from 'react'

import { usePendingJoinProvider } from '@/hooks/use-pending-join-provider'

export function useRegisterPage() {
  const registerMutation = useRegisterUsersRegisterPost()
  const [done, setDone] = useState(false)
  const { providerId, providerName, loginPath } = usePendingJoinProvider()

  const description = providerName
    ? `Crea tu cuenta para solicitar vínculo con ${providerName}. Te enviaremos un correo para confirmarla.`
    : providerId
      ? 'Crea tu cuenta para continuar con la solicitud de vínculo. Te enviaremos un correo para confirmarla.'
      : 'Crea tu cuenta de vendedor. Te enviaremos un correo para confirmarla.'

  const successMessage = done
    ? providerName
      ? `Te enviamos un correo con un enlace para confirmar tu cuenta. Cuando confirmes, inicia sesión y seguiremos con ${providerName}.`
      : 'Te enviamos un correo con un enlace para confirmar tu cuenta. Revisa tu bandeja de entrada (o MailHog en desarrollo).'
    : null

  const onSubmit = async (values: RegisterFormValues) => {
    registerMutation.reset()
    await registerMutation.mutateAsync({
      data: {
        ...values,
        client_app: 'seller',
      },
    })
    setDone(true)
  }

  return {
    schema: registerSchema,
    description,
    successMessage,
    loginHref: loginPath,
    isSubmitting: registerMutation.isPending,
    error: registerMutation.isError
      ? formatApiError(registerMutation.error, 'No se pudo crear la cuenta.')
      : null,
    onSubmit,
  }
}
