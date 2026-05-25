import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type Resolver } from 'react-hook-form'
import type { z } from 'zod'
import { Button } from '../ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

export type LoginFields = {
  username: string
  password: string
}

export type LoginFormProps = {
  title: string
  description: string
  schema: z.ZodType<LoginFields>
  onSubmit: (values: LoginFields) => void | Promise<void>
  isSubmitting?: boolean
  error?: string | null
  submitLabel?: string
}

export function LoginForm({
  title,
  description,
  schema,
  onSubmit,
  isSubmitting = false,
  error = null,
  submitLabel = 'Entrar',
}: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(schema as never) as Resolver<LoginFields>,
    defaultValues: { username: '', password: '' },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-headline">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                aria-invalid={Boolean(errors.username)}
                {...register('username')}
              />
              {errors.username?.message ? (
                <p className="text-sm text-destructive">
                  {errors.username.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                {...register('password')}
              />
              {errors.password?.message ? (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              ) : null}
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando…' : submitLabel}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
