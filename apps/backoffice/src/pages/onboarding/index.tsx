import {
  formatApiError,
  getMyOrganizationsUsersMyOrganizationsGetQueryKey,
  OrganizationType,
  useCreateOrganizationOrganizationsPost,
} from '@broker/api'
import { CreateOrganizationForm, peekInviteToken } from '@broker/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

type OnboardingPageProps = {
  organizationType: typeof OrganizationType.provider | typeof OrganizationType.seller
  title?: string
  description?: string
}

export function OnboardingPage({
  organizationType,
  title,
  description,
}: OnboardingPageProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const createMutation = useCreateOrganizationOrganizationsPost()

  return (
    <CreateOrganizationForm
      title={title}
      description={description}
      isSubmitting={createMutation.isPending}
      error={
        createMutation.isError
          ? formatApiError(createMutation.error, 'No se pudo crear la organización.')
          : null
      }
      onSubmit={async ({ name }) => {
        createMutation.reset()
        await createMutation.mutateAsync({
          data: { name, type: organizationType },
        })
        await queryClient.invalidateQueries({
          queryKey: getMyOrganizationsUsersMyOrganizationsGetQueryKey(),
        })
        if (peekInviteToken()) {
          void navigate('/accept-invitation')
          return
        }
        void navigate('/')
      }}
    />
  )
}
