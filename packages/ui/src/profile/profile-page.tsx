import {
  formatApiError,
  getMeUsersMeGetQueryKey,
  useAuth,
  useUpdateMeUsersMePatch,
} from '@broker/api'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { UserRound } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '../components/button'
import { PageLoading } from '../components/page-loading'
import { PageWrapper } from '../components/page-wrapper'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Field, FieldError, FieldLabel } from '../components/ui/field'
import { Input } from '../components/ui/input'
import { notify } from '../lib/notify'

const profileFormSchema = z.object({
  phone: z.string().trim().max(50, 'Máximo 50 caracteres'),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfilePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const updateMutation = useUpdateMeUsersMePatch()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { phone: user?.phone ?? '' },
  })

  useEffect(() => {
    form.reset({ phone: user?.phone ?? '' })
  }, [user?.phone, form])

  if (!user) {
    return <PageLoading title="Cargando perfil…" />
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateMutation.mutateAsync({
        data: { phone: values.phone.trim() || null },
      })
      await queryClient.invalidateQueries({ queryKey: getMeUsersMeGetQueryKey() })
      notify.updated('Perfil', 'm')
    } catch (error) {
      notify.error(error, 'No se pudo guardar el perfil')
    }
  })

  return (
    <PageWrapper
      title="Mi perfil"
      description="Datos de contacto para tus publicaciones en redes."
      icon={UserRound}
    >
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Teléfono</CardTitle>
            <CardDescription>
              Este número se usará como enlace de WhatsApp cuando publiques
              productos en redes sociales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="profile-phone">Número de teléfono</FieldLabel>
                    <Input
                      {...field}
                      id="profile-phone"
                      inputMode="tel"
                      autoComplete="tel"
                      maxLength={50}
                      placeholder="Ej. 51234567"
                      disabled={updateMutation.isPending}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Incluye el código de país si no es un móvil cubano de 8
                        dígitos.
                      </p>
                    )}
                  </Field>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Guardando…' : 'Guardar'}
                </Button>
              </div>
              {updateMutation.isError ? (
                <p className="text-sm text-destructive" role="alert">
                  {formatApiError(updateMutation.error, 'No se pudo guardar el perfil')}
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}
