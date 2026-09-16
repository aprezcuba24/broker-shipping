import {
  formatApiError,
  resetPasswordSchema,
  useResetPasswordEndpointUsersResetPasswordPost,
  type ResetPasswordFormValues,
} from '@broker/api'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const mutation = useResetPasswordEndpointUsersResetPasswordPost()
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setError(null)
    try {
      await mutation.mutateAsync({
        data: { token, password: values.password },
      })
      setSuccessMessage('Contraseña actualizada. Ya puedes iniciar sesión.')
    } catch (err) {
      setError(formatApiError(err, 'El enlace no es válido o ha caducado.'))
    }
  }

  return {
    token,
    schema: resetPasswordSchema,
    isSubmitting: mutation.isPending,
    error,
    successMessage,
    onSubmit,
  }
}
