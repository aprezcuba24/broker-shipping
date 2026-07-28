import { VerifyEmailCard } from '@broker/ui'
import { useVerifyEmail } from '@/hooks/use-verify-email'

export function VerifyEmailPage() {
  const { status, message } = useVerifyEmail()
  return <VerifyEmailCard status={status} message={message} />
}
