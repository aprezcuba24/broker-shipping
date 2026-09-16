import { ForgotPasswordForm } from '@broker/ui'
import { useForgotPassword } from '@/hooks/use-forgot-password'
import { portalTheme } from '@/config/portal-theme'

export function ForgotPasswordPage() {
  const forgot = useForgotPassword()

  return (
    <ForgotPasswordForm
      portal={portalTheme}
      schema={forgot.schema}
      isSubmitting={forgot.isSubmitting}
      error={forgot.error}
      successMessage={forgot.successMessage}
      loginHref={forgot.loginHref}
      onSubmit={forgot.onSubmit}
    />
  )
}
