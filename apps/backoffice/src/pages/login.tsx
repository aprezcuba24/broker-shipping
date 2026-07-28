import { AuthFormLink, Button, LoginForm } from '@broker/ui'
import { useLoginPage } from '@/hooks/use-login-page'

export function LoginPage() {
  const login = useLoginPage()

  return (
    <LoginForm
      title="Broker"
      description="Portal de proveedores. Introduce tus credenciales para continuar."
      schema={login.schema}
      isSubmitting={login.isSubmitting}
      error={login.error}
      successMessage={login.successMessage}
      footer={
        <div className="space-y-2">
          {login.showResend ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={login.resendPending}
              onClick={() => void login.onResend()}
            >
              {login.resendPending ? 'Reenviando…' : 'Reenviar correo de confirmación'}
            </Button>
          ) : null}
          <p>
            ¿No tienes cuenta? <AuthFormLink to="/register">Crear cuenta</AuthFormLink>
          </p>
        </div>
      }
      onSubmit={login.onSubmit}
    />
  )
}
