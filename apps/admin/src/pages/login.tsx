import { loginSchema, useAuth } from '@broker/api'
import { LoginForm } from '@broker/ui'
import { useNavigate } from 'react-router-dom'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoggingIn, loginError } = useAuth()

  return (
    <LoginForm
      title="Broker"
      description="Administración global. Introduce tus credenciales para continuar."
      schema={loginSchema}
      isSubmitting={isLoggingIn}
      error={loginError}
      onSubmit={async (values) => {
        await login(values)
        void navigate('/organizations')
      }}
    />
  )
}
