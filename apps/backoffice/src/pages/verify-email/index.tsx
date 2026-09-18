import { VerifyEmailCard } from '@broker/ui'
import { useVerifyEmail } from '@/hooks/use-verify-email'
import { portalTheme } from '@/config/portal-theme'

export function VerifyEmailPage() {
  const { status, message, loginHref } = useVerifyEmail()
  return (
    <VerifyEmailCard
      status={status}
      message={message}
      loginHref={loginHref}
      portal={portalTheme}
    />
  )
}
