import {
  formatApiError,
  loginSchema,
  useAuth,
  useResendVerificationUsersResendVerificationPost,
} from '@broker/api'
import { AuthFormLink, Button, LoginForm } from '@broker/ui'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, isLoggingIn, loginError, isEmailNotVerified } = useAuth()
  const resendMutation = useResendVerificationUsersResendVerificationPost()
  const [lastEmail, setLastEmail] = useState('')
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  const verified = searchParams.get('verified') === '1'

  return (
    <LoginForm
      title="Broker"
      description="Portal de vendedores. Introduce tus credenciales para continuar."
      schema={loginSchema}
      isSubmitting={isLoggingIn}
      error={loginError}
      successMessage={
        resendMessage ??
        (verified ? 'Correo confirmado. Ya puedes iniciar sesión.' : null)
      }
      footer={
        <div className="space-y-2">
          {isEmailNotVerified && lastEmail ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={resendMutation.isPending}
              onClick={async () => {
                setResendMessage(null)
                try {
                  await resendMutation.mutateAsync({
                    data: { email: lastEmail, client_app: 'seller' },
                  })
                  setResendMessage(
                    'Si la cuenta existe y no está verificada, te enviamos un nuevo enlace.',
                  )
                } catch (error) {
                  setResendMessage(
                    formatApiError(error, 'No se pudo reenviar el correo de confirmación.'),
                  )
                }
              }}
            >
              {resendMutation.isPending ? 'Reenviando…' : 'Reenviar correo de confirmación'}
            </Button>
          ) : null}
          <p>
            ¿No tienes cuenta? <AuthFormLink to="/register">Crear cuenta</AuthFormLink>
          </p>
        </div>
      }
      onSubmit={async (values) => {
        setLastEmail(values.email)
        setResendMessage(null)
        await login(values)
        void navigate('/')
      }}
    />
  )
}
