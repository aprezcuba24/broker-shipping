import { ResetPasswordForm } from '@broker/ui'
import { useResetPassword } from '@/hooks/use-reset-password'
import { portalTheme } from '@/config/portal-theme'

export function ResetPasswordPage() {
  const reset = useResetPassword()

  return (
    <ResetPasswordForm
      portal={portalTheme}
      token={reset.token}
      schema={reset.schema}
      isSubmitting={reset.isSubmitting}
      error={reset.error}
      successMessage={reset.successMessage}
      loginHref={reset.loginHref}
      onSubmit={reset.onSubmit}
    />
  )
}
