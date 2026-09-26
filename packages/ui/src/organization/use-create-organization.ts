import {
  formatApiError,
  getGetOrganizationOrganizationsOrganizationIdGetQueryKey,
  getListOrganizationsDirectoryOrganizationsDirectoryGetQueryKey,
  getMyOrganizationsUsersMyOrganizationsGetQueryKey,
  useAuth,
  useCreateOrganizationOrganizationsPost,
} from '@broker/api'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { notify } from '../lib/notify'
import { useActiveOrganization } from './active-organization-context'
import type { CreateOrganizationFields } from './create-organization-form'

export function useCreateOrganization() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { organizationType, setActiveOrganization } = useActiveOrganization()
  const queryClient = useQueryClient()
  const createMutation = useCreateOrganizationOrganizationsPost()

  const onCreate = async ({ name }: CreateOrganizationFields) => {
    if (!organizationType) {
      throw new Error('organizationType is required to create an organization')
    }
    createMutation.reset()
    const org = await createMutation.mutateAsync({
      data: { name, type: organizationType },
    })
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getMyOrganizationsUsersMyOrganizationsGetQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: getListOrganizationsDirectoryOrganizationsDirectoryGetQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: getGetOrganizationOrganizationsOrganizationIdGetQueryKey(org.id),
      }),
    ])
    setActiveOrganization(org.id)
    notify.created('Organización', 'f')
    if (user?.is_super_admin) {
      void navigate('/')
    }
  }

  return {
    organizationType,
    isSubmitting: createMutation.isPending,
    error: createMutation.isError
      ? formatApiError(createMutation.error, 'No se pudo crear.')
      : null,
    onCreate,
  }
}
