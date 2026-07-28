import {
  formatApiError,
  registerSchema,
  useRegisterUsersRegisterPost,
  type RegisterFormValues,
} from '@broker/api'
import { useState } from 'react'

export function useRegisterPage() {
  const registerMutation = useRegisterUsersRegisterPost()
  const [done, setDone] = useState(false)

  const onSubmit = async (values: RegisterFormValues) => {
    registerMutation.reset()
    await registerMutation.mutateAsync({
      data: {
        ...values,
        client_app: 'backoffice',
      },
    })
    setDone(true)
  }

  return {
    schema: registerSchema,
    isSubmitting: registerMutation.isPending,
    error: registerMutation.isError
      ? formatApiError(registerMutation.error, 'No se pudo crear la cuenta.')
      : null,
    successMessage: done
      ? 'Te enviamos un correo con un enlace para confirmar tu cuenta. Revisa tu bandeja de entrada (o MailHog en desarrollo).'
      : null,
    onSubmit,
  }
}
