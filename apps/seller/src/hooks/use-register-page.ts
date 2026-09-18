import {
  formatApiError,
  registerSchema,
  useRegisterUsersRegisterPost,
  type RegisterFormValues,
} from '@broker/api'
import { usePendingMemberInvite } from '@broker/ui'
import { useState } from 'react'

import { usePendingJoinProvider } from '@/hooks/use-pending-join-provider'

export function useRegisterPage() {
  const registerMutation = useRegisterUsersRegisterPost()
  const [done, setDone] = useState(false)
  const memberInvite = usePendingMemberInvite()
  const { providerId, providerName, loginPath } = usePendingJoinProvider()

  // Member invite takes precedence over join-provider.
  const hasMemberInvite = Boolean(memberInvite.token)

  const description = hasMemberInvite
    ? 'Crea tu cuenta para unirte a la organización. Te enviaremos un correo para confirmarla.'
    : providerId
      ? 'Crea tu cuenta para continuar con la solicitud de vínculo. Te enviaremos un correo para confirmarla.'
      : 'Crea tu cuenta de vendedor. Te enviaremos un correo para confirmarla.'

  const successMessage = done
    ? hasMemberInvite && memberInvite.organizationName
      ? `Te enviamos un correo con un enlace para confirmar tu cuenta. Cuando confirmes, inicia sesión y te unirás a ${memberInvite.organizationName}.`
      : providerName
        ? 'Te enviamos un correo con un enlace para confirmar tu cuenta. Cuando confirmes, inicia sesión y seguiremos con la vinculación.'
        : 'Te enviamos un correo con un enlace para confirmar tu cuenta. Revisa tu bandeja de entrada.'
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
    memberInviteOrganizationName: hasMemberInvite ? memberInvite.organizationName : null,
    linkedProviderName: hasMemberInvite ? null : providerName,
    defaultEmail: hasMemberInvite ? (memberInvite.inviteeEmail ?? '') : '',
    emailReadOnly: hasMemberInvite && Boolean(memberInvite.inviteeEmail),
    successMessage,
    loginHref: hasMemberInvite ? memberInvite.loginPath : loginPath,
    isSubmitting: registerMutation.isPending,
    error: registerMutation.isError
      ? formatApiError(registerMutation.error, 'No se pudo crear la cuenta.')
      : null,
    onSubmit,
  }
}
