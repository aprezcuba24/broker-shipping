import { AuthFormLink, Button, LoginForm, PRODUCT_NAME } from '@broker/ui'
import { useLoginPage } from '@/hooks/use-login-page'
import { portalTheme } from '@/config/portal-theme'

export function LoginPage() {
  const login = useLoginPage()

  return (
    <LoginForm
      title={PRODUCT_NAME}
      description={login.description}
      portal={portalTheme}
      schema={login.schema}
      linkedProviderName={login.linkedProviderName}
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
            ¿No tienes cuenta?{' '}
            <AuthFormLink to={login.registerPath}>Crear cuenta</AuthFormLink>
          </p>
        </div>
      }
      forgotPasswordHref={login.forgotPasswordHref}
      onSubmit={login.onSubmit}
    />
  )
}
