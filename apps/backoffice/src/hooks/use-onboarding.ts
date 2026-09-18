import {
  formatApiError,
  getMyOrganizationsUsersMyOrganizationsGetQueryKey,
  OrganizationType,
  useAuth,
  useCreateOrganizationOrganizationsPost,
} from '@broker/api'
import { notify, peekInviteToken } from '@broker/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

export function useOnboarding() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const createMutation = useCreateOrganizationOrganizationsPost()

  const onSubmit = async ({ name }: { name: string }) => {
    createMutation.reset()
    await createMutation.mutateAsync({
      data: { name, type: OrganizationType.provider },
    })
    await queryClient.invalidateQueries({
      queryKey: getMyOrganizationsUsersMyOrganizationsGetQueryKey(),
    })
    notify.created('Organización', 'f')
    if (peekInviteToken()) {
      void navigate('/accept-invitation')
      return
    }
    void navigate('/')
  }

  return {
    defaultName: user?.name?.trim() || undefined,
    isSubmitting: createMutation.isPending,
    error: createMutation.isError
      ? formatApiError(createMutation.error, 'No se pudo crear la organización.')
      : null,
    onSubmit,
  }
}
