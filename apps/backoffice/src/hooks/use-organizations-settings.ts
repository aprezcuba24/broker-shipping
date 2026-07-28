import {
  formatApiError,
  getMyOrganizationsUsersMyOrganizationsGetQueryKey,
  OrganizationType,
  useCreateOrganizationOrganizationsPost,
  useListOrganizationsOrganizationsGet,
} from '@broker/api'
import { useActiveOrganization } from '@broker/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export function useOrganizationsSettings() {
  const { organizations, setActiveOrganization } = useActiveOrganization()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const createMutation = useCreateOrganizationOrganizationsPost()
  const listQuery = useListOrganizationsOrganizationsGet()

  const onCreate = async ({ name }: { name: string }) => {
    createMutation.reset()
    const org = await createMutation.mutateAsync({
      data: { name, type: OrganizationType.provider },
    })
    await queryClient.invalidateQueries({
      queryKey: getMyOrganizationsUsersMyOrganizationsGetQueryKey(),
    })
    await listQuery.refetch()
    setActiveOrganization(org.id)
    setShowForm(false)
  }

  return {
    organizations,
    showForm,
    toggleForm: () => setShowForm((v) => !v),
    selectOrganization: setActiveOrganization,
    createFormProps: {
      isSubmitting: createMutation.isPending,
      error: createMutation.isError
        ? formatApiError(createMutation.error, 'No se pudo crear.')
        : null,
      onSubmit: onCreate,
    },
  }
}
