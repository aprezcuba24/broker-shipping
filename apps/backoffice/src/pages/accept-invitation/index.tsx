import { AcceptInvitationCard } from '@broker/ui'
import { useAcceptInvitation } from '@/hooks/use-accept-invitation'
import { useNavigate } from 'react-router-dom'

export function AcceptInvitationPage() {
  const navigate = useNavigate()
  const { status, message, retry } = useAcceptInvitation()

  return (
    <AcceptInvitationCard
      status={status}
      message={message}
      onRetry={retry}
      onGoHome={() => void navigate('/')}
      onGoLogin={() => void navigate('/login')}
    />
  )
}
