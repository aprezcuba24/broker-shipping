import { LoginForm } from '@broker/ui'
import { useLoginPage } from '@/hooks/use-login-page'

export function LoginPage() {
  const login = useLoginPage()

  return (
    <LoginForm
      title="Broker"
      description="Administración global. Introduce tus credenciales para continuar."
      schema={login.schema}
      isSubmitting={login.isSubmitting}
      error={login.error}
      onSubmit={login.onSubmit}
    />
  )
}
