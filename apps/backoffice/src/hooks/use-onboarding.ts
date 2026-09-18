import {
  formatApiError,
  getMyOrganizationsUsersMyOrganizationsGetQueryKey,
  OrganizationType,
  useAuth,
  useCreateOrganizationOrganizationsPost,
} from '@broker/api'
import { notify, peekInviteToken } from '@broker/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useOnboarding() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const createMutation = useCreateOrganizationOrganizationsPost()

  useEffect(() => {
    if (peekInviteToken()) {
      void navigate('/accept-invitation', { replace: true })
    }
  }, [navigate])

  const onSubmit = async ({ name }: { name: string }) => {
    if (peekInviteToken()) {
      void navigate('/accept-invitation', { replace: true })
      return
    }
    createMutation.reset()
    await createMutation.mutateAsync({
      data: { name, type: OrganizationType.provider },
    })
    await queryClient.invalidateQueries({
      queryKey: getMyOrganizationsUsersMyOrganizationsGetQueryKey(),
    })
    notify.created('Organización', 'f')
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
