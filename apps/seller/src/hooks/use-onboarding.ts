import {
  formatApiError,
  getMyOrganizationsUsersMyOrganizationsGetQueryKey,
  OrganizationType,
  PlatformProductCode,
  useAuth,
  useCreateOrganizationOrganizationsPost,
} from '@broker/api'
import { notify, peekInviteToken, PRODUCT_NAME } from '@broker/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { usePendingJoinProvider } from '@/hooks/use-pending-join-provider'

export type OnboardingStep = 'organization' | 'products'

export function useOnboarding() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const createMutation = useCreateOrganizationOrganizationsPost()
  const { providerId, providerName, joinProviderPath } = usePendingJoinProvider()

  const [step, setStep] = useState<OnboardingStep>('organization')
  const [orgName, setOrgName] = useState('')

  useEffect(() => {
    if (peekInviteToken()) {
      void navigate('/accept-invitation', { replace: true })
    }
  }, [navigate])

  const description = providerId
    ? 'Crea tu organización vendedora. Después enviaremos la solicitud de vínculo.'
    : `Como vendedor, crea la organización con la que trabajarás en ${PRODUCT_NAME}.`

  const onOrganizationSubmit = async ({ name }: { name: string }) => {
    if (peekInviteToken()) {
      void navigate('/accept-invitation', { replace: true })
      return
    }
    setOrgName(name)
    setStep('products')
  }

  const onProductsSubmit = async (codes: PlatformProductCode[]) => {
    if (peekInviteToken()) {
      void navigate('/accept-invitation', { replace: true })
      return
    }
    createMutation.reset()
    await createMutation.mutateAsync({
      data: {
        name: orgName,
        type: OrganizationType.seller,
        platform_product_codes: codes,
      },
    })
    await queryClient.invalidateQueries({
      queryKey: getMyOrganizationsUsersMyOrganizationsGetQueryKey(),
    })
    notify.created('Organización', 'f')
    if (providerId) {
      void navigate(joinProviderPath)
      return
    }
    void navigate('/')
  }

  return {
    step,
    description,
    defaultName: orgName || user?.name?.trim() || undefined,
    linkedProviderName: providerName,
    isSubmittingOrg: createMutation.isPending,
    orgError: createMutation.isError
      ? formatApiError(createMutation.error, 'No se pudo crear la organización.')
      : null,
    onOrganizationSubmit,
    onProductsSubmit,
    onBackToOrganization: () => setStep('organization'),
  }
}
