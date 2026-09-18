import { RegisterForm } from '@broker/ui'
import { useRegisterPage } from '@/hooks/use-register-page'
import { portalTheme } from '@/config/portal-theme'

export function RegisterPage() {
  const register = useRegisterPage()

  return (
    <RegisterForm
      key={register.defaultEmail || 'register'}
      title="Crear cuenta"
      description={register.description}
      portal={portalTheme}
      schema={register.schema}
      linkedProviderName={register.linkedProviderName}
      memberInviteOrganizationName={register.memberInviteOrganizationName}
      defaultEmail={register.defaultEmail}
      emailReadOnly={register.emailReadOnly}
      isSubmitting={register.isSubmitting}
      error={register.error}
      successMessage={register.successMessage}
      loginHref={register.loginHref}
      onSubmit={register.onSubmit}
    />
  )
}
