import { loginSchema, useAuth, type LoginFormValues } from '@broker/api'
import { useNavigate } from 'react-router-dom'

export function useLoginPage() {
  const navigate = useNavigate()
  const { login, isLoggingIn, loginError } = useAuth()

  const onSubmit = async (values: LoginFormValues) => {
    await login(values)
    void navigate('/')
  }

  return {
    schema: loginSchema,
    isSubmitting: isLoggingIn,
    error: loginError,
    onSubmit,
  }
}
