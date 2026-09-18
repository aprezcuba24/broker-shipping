import {
  formatApiError,
  getMyOrganizationsUsersMyOrganizationsGetQueryKey,
  OrganizationType,
  useAuth,
  useCreateOrganizationOrganizationsPost,
} from '@broker/api'
import { notify, peekInviteToken, PRODUCT_NAME } from '@broker/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { usePendingJoinProvider } from '@/hooks/use-pending-join-provider'

export function useOnboarding() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const createMutation = useCreateOrganizationOrganizationsPost()
  const { providerId, providerName, joinProviderPath } = usePendingJoinProvider()

  const description = providerId
    ? 'Crea tu organización vendedora. Después enviaremos la solicitud de vínculo.'
    : `Como vendedor, crea la organización con la que trabajarás en ${PRODUCT_NAME}.`

  const onSubmit = async ({ name }: { name: string }) => {
    createMutation.reset()
    await createMutation.mutateAsync({
      data: { name, type: OrganizationType.seller },
    })
    await queryClient.invalidateQueries({
      queryKey: getMyOrganizationsUsersMyOrganizationsGetQueryKey(),
    })
    notify.created('Organización', 'f')
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

  return {
    description,
    defaultName: user?.name?.trim() || undefined,
    linkedProviderName: providerName,
    isSubmitting: createMutation.isPending,
    error: createMutation.isError
      ? formatApiError(createMutation.error, 'No se pudo crear la organización.')
      : null,
    onSubmit,
  }
}
