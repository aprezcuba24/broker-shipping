import { AcceptInvitationCard } from '@broker/ui'
import { useAcceptInvitation } from '@/hooks/use-accept-invitation'
import { useNavigate } from 'react-router-dom'
import { portalTheme } from '@/config/portal-theme'

export function AcceptInvitationPage() {
  const navigate = useNavigate()
  const { status, message, retry } = useAcceptInvitation()

  return (
    <AcceptInvitationCard
      status={status}
      message={message}
      portal={portalTheme}
      onRetry={retry}
      onGoHome={() => void navigate('/')}
      onGoLogin={() => void navigate('/login')}
      onGoOnboarding={() => void navigate('/onboarding')}
    />
  )
}
