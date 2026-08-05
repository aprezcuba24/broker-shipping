import { RegisterForm } from '@broker/ui'
import { useRegisterPage } from '@/hooks/use-register-page'
import { portalTheme } from '@/config/portal-theme'

type RegisterPageProps = {
  description: string
}

export function RegisterPage({ description }: RegisterPageProps) {
  const register = useRegisterPage()

  return (
    <RegisterForm
      title="Crear cuenta"
      description={description}
      portal={portalTheme}
      schema={register.schema}
      isSubmitting={register.isSubmitting}
      error={register.error}
      successMessage={register.successMessage}
      onSubmit={register.onSubmit}
    />
  )
}
