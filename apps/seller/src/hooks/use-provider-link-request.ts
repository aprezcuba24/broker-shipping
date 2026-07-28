import {
  formatApiError,
  getListMySellerLinkRequestsOrganizationsSellerSellerLinkRequestsMineGetQueryKey,
  useCreateSellerLinkRequestOrganizationsSellerOrganizationIdSellerLinkRequestsPost,
  useListMySellerLinkRequestsOrganizationsSellerSellerLinkRequestsMineGet,
} from '@broker/api'
import { useActiveOrganization } from '@broker/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export function useProviderLinkRequest() {
  const { activeOrganization } = useActiveOrganization()
  const queryClient = useQueryClient()
  const [success, setSuccess] = useState<string | null>(null)
  const createMutation =
    useCreateSellerLinkRequestOrganizationsSellerOrganizationIdSellerLinkRequestsPost()
  const mineQuery = useListMySellerLinkRequestsOrganizationsSellerSellerLinkRequestsMineGet()

  return {
    activeOrganization,
    createFormProps: {
      isSubmitting: createMutation.isPending,
      successMessage: success,
      error: createMutation.isError
        ? formatApiError(createMutation.error, 'No se pudo enviar la solicitud.')
        : null,
      onSubmit: async ({
        provider_organization_id,
      }: {
        provider_organization_id: string
      }) => {
        if (!activeOrganization) return
        setSuccess(null)
        createMutation.reset()
        await createMutation.mutateAsync({
          organizationId: provider_organization_id,
          params: { seller_organization_id: activeOrganization.id },
        })
        setSuccess('Solicitud enviada. El proveedor recibirá un correo.')
        await queryClient.invalidateQueries({
          queryKey:
            getListMySellerLinkRequestsOrganizationsSellerSellerLinkRequestsMineGetQueryKey(),
        })
      },
    },
    requests: mineQuery.data ?? [],
    isLoadingRequests: mineQuery.isPending,
  }
}
