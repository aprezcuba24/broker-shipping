import {
  formatApiError,
  getMyOrganizationsUsersMyOrganizationsGetQueryKey,
  useCreateOrganizationOrganizationsPost,
} from '@broker/api'
import { useQueryClient } from '@tanstack/react-query'
import { useActiveOrganization } from './active-organization-context'
import type { CreateOrganizationFields } from './create-organization-form'

export function useCreateOrganization() {
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
    await queryClient.invalidateQueries({
      queryKey: getMyOrganizationsUsersMyOrganizationsGetQueryKey(),
    })
    setActiveOrganization(org.id)
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
