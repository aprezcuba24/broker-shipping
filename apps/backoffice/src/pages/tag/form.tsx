import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Switch,
  useFormSubmitHandle,
  type EntityFormProps,
} from '@broker/ui'

export const tagFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  is_active: z.boolean(),
})

export type TagFormValues = z.infer<typeof tagFormSchema>

export const tagFormDefaultValues: TagFormValues = {
  name: '',
  is_active: true,
}

export function TagForm({
  ref,
  defaultValues = tagFormDefaultValues,
  onSubmit,
  isSubmitting = false,
  error = null,
}: EntityFormProps<TagFormValues>) {
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues,
  })

  useFormSubmitHandle(ref, form.handleSubmit, onSubmit)

  return (
    <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="tag-name">Nombre</FieldLabel>
              <Input
                {...field}
                id="tag-name"
                maxLength={255}
                autoFocus
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        <Controller
          name="is_active"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field
              orientation="horizontal"
              data-invalid={fieldState.invalid}
              className="items-center justify-between gap-3"
            >
              <FieldLabel htmlFor="tag-is-active">Activo</FieldLabel>
              <Switch
                id="tag-is-active"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isSubmitting}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />
      </FieldGroup>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  )
}
