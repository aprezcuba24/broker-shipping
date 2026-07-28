import {
  formatApiError,
  registerSchema,
  useRegisterUsersRegisterPost,
  type ClientApp,
  type RegisterFormValues,
} from '@broker/api'
import { RegisterForm } from '@broker/ui'
import { useState } from 'react'

type RegisterPageProps = {
  clientApp: ClientApp
  description: string
}

export function RegisterPage({ clientApp, description }: RegisterPageProps) {
  const registerMutation = useRegisterUsersRegisterPost()
  const [done, setDone] = useState(false)

  const error = registerMutation.isError
    ? formatApiError(registerMutation.error, 'No se pudo crear la cuenta.')
    : null

  return (
    <RegisterForm
      title="Crear cuenta"
      description={description}
      schema={registerSchema}
      isSubmitting={registerMutation.isPending}
      error={error}
      successMessage={
        done
          ? 'Te enviamos un correo con un enlace para confirmar tu cuenta. Revisa tu bandeja de entrada (o MailHog en desarrollo).'
          : null
      }
      onSubmit={async (values: RegisterFormValues) => {
        registerMutation.reset()
        await registerMutation.mutateAsync({
          data: {
            ...values,
            client_app: clientApp,
          },
        })
        setDone(true)
      }}
    />
  )
}
