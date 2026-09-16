import {
  formatApiError,
  forgotPasswordSchema,
  useForgotPasswordUsersForgotPasswordPost,
  type ForgotPasswordFormValues,
} from '@broker/api'

import { usePendingJoinProvider } from '@/hooks/use-pending-join-provider'
import { useState } from 'react'

export function useForgotPassword() {
  const mutation = useForgotPasswordUsersForgotPasswordPost()
  const { loginPath } = usePendingJoinProvider()
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setError(null)
    try {
      await mutation.mutateAsync({
        data: { email: values.email, client_app: 'seller' },
      })
      setSuccessMessage(
        'Si existe una cuenta con ese correo, te enviamos un enlace para restablecer la contraseña.',
      )
    } catch (err) {
      setError(formatApiError(err, 'No se pudo enviar el correo de recuperación.'))
    }
  }

  return {
    schema: forgotPasswordSchema,
    isSubmitting: mutation.isPending,
    error,
    successMessage,
    loginHref: loginPath,
    onSubmit,
  }
}
