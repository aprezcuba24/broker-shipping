import { CreateOrganizationForm } from '@broker/ui'
import { useOnboarding } from '@/hooks/use-onboarding'
import { portalTheme } from '@/config/portal-theme'

const NAME_HINT = 'Puedes usar otro nombre si lo deseas.'

type OnboardingPageProps = {
  title?: string
  description?: string
}

export function OnboardingPage({ title, description }: OnboardingPageProps) {
  const onboarding = useOnboarding()

  return (
    <CreateOrganizationForm
      title={title}
      description={description ?? onboarding.description}
      portal={portalTheme}
      defaultName={onboarding.defaultName}
      nameHint={NAME_HINT}
      linkedProviderName={onboarding.linkedProviderName}
      isSubmitting={onboarding.isSubmitting}
      error={onboarding.error}
      onSubmit={onboarding.onSubmit}
    />
  )
}
