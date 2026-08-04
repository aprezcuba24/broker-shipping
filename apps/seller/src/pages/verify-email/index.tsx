import { VerifyEmailCard } from '@broker/ui'
import { useVerifyEmail } from '@/hooks/use-verify-email'
import { portalTheme } from '@/config/portal-theme'

export function VerifyEmailPage() {
  const { status, message } = useVerifyEmail()
  return <VerifyEmailCard status={status} message={message} portal={portalTheme} />
}
