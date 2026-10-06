import { CreateOrganizationForm } from '@broker/ui'
import { useOnboarding } from '@/hooks/use-onboarding'
import { portalTheme } from '@/config/portal-theme'
import { OnboardingProductsStep } from './onboarding-products-step'

const NAME_HINT = 'Puedes usar otro nombre si lo deseas.'

type OnboardingPageProps = {
  title?: string
  description?: string
}

export function OnboardingPage({ title, description }: OnboardingPageProps) {
  const onboarding = useOnboarding()

  if (onboarding.step === 'products') {
    return (
      <OnboardingProductsStep
        portal={portalTheme}
        isSubmitting={onboarding.isSubmittingOrg}
        error={onboarding.orgError}
        onBack={onboarding.onBackToOrganization}
        onSubmit={onboarding.onProductsSubmit}
      />
    )
  }

  return (
    <CreateOrganizationForm
      title={title}
      description={description ?? onboarding.description}
      portal={portalTheme}
      defaultName={onboarding.defaultName}
      nameHint={NAME_HINT}
      linkedProviderName={onboarding.linkedProviderName}
      isSubmitting={false}
      onSubmit={onboarding.onOrganizationSubmit}
    />
  )
}
