import { JoinProviderCard } from '@broker/ui'
import { useNavigate } from 'react-router-dom'

import { portalTheme } from '@/config/portal-theme'
import { useJoinProvider } from '@/hooks/use-join-provider'

export function JoinProviderPage() {
  const navigate = useNavigate()
  const {
    status,
    message,
    providerName,
    loginPath,
    registerPath,
    onboardingPath,
    retry,
  } = useJoinProvider()

  return (
    <JoinProviderCard
      status={status}
      message={message}
      providerName={providerName}
      portal={portalTheme}
      onRetry={retry}
      onGoLogin={() => void navigate(loginPath)}
      onGoRegister={() => void navigate(registerPath)}
      onGoOnboarding={() => void navigate(onboardingPath)}
      onGoProviders={() => void navigate('/providers?tab=pending')}
    />
  )
}
