import {
  formatApiError,
  registerSchema,
  useRegisterUsersRegisterPost,
  type RegisterFormValues,
} from '@broker/api'
import { usePendingMemberInvite } from '@broker/ui'
import { useState } from 'react'

export function useRegisterPage() {
  const registerMutation = useRegisterUsersRegisterPost()
  const [done, setDone] = useState(false)
  const { organizationName, inviteeEmail, loginPath } = usePendingMemberInvite()

  const description = organizationName
    ? 'Crea tu cuenta para unirte a la organización. Te enviaremos un correo para confirmarla.'
    : 'Crea tu cuenta de proveedor. Te enviaremos un correo para confirmarla.'

  const successMessage = done
    ? organizationName
      ? `Te enviamos un correo con un enlace para confirmar tu cuenta. Cuando confirmes, inicia sesión y te unirás a ${organizationName}.`
      : 'Te enviamos un correo con un enlace para confirmar tu cuenta. Revisa tu bandeja de entrada.'
    : null

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
    description,
    memberInviteOrganizationName: organizationName,
    defaultEmail: inviteeEmail ?? '',
    emailReadOnly: Boolean(inviteeEmail),
    successMessage,
    loginHref: loginPath,
    isSubmitting: registerMutation.isPending,
    error: registerMutation.isError
      ? formatApiError(registerMutation.error, 'No se pudo crear la cuenta.')
      : null,
    onSubmit,
  }
}
