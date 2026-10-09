import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FormFieldCell,
  FormSection,
  ImageField,
  Input,
  Textarea,
  imageFieldDefaultValue,
  imageFieldSchema,
  useFormSubmitHandle,
  type EntityFormProps,
} from '@broker/ui'

export const adsMessageFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'El título es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  description: z.string().trim().min(1, 'La descripción es obligatoria'),
  image: imageFieldSchema,
})

export type AdsMessageFormValues = z.infer<typeof adsMessageFormSchema>

export const adsMessageFormDefaultValues: AdsMessageFormValues = {
  title: '',
  description: '',
  image: imageFieldDefaultValue,
}

export type AdsMessageFormProps = EntityFormProps<AdsMessageFormValues> & {
  code?: string | null
}

export function AdsMessageForm({
  ref,
  defaultValues = adsMessageFormDefaultValues,
  onSubmit,
  isSubmitting = false,
  error = null,
  code = null,
}: AdsMessageFormProps) {
  const form = useForm<AdsMessageFormValues>({
    resolver: zodResolver(adsMessageFormSchema),
    defaultValues,
  })

  useFormSubmitHandle(ref, form.handleSubmit, onSubmit)

  return (
    <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
      <FormSection title="Foto">
        <FormFieldCell fullWidth>
          <Controller
            name="image"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="ads-message-image">Foto del anuncio</FieldLabel>
                <ImageField
                  id="ads-message-image"
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                  alt="Foto del anuncio"
                  size="xl"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FormFieldCell>
      </FormSection>

      <FormSection title="Datos del anuncio">
        {code ? (
          <FormFieldCell>
            <Field>
              <FieldLabel htmlFor="ads-message-code">Código</FieldLabel>
              <Input id="ads-message-code" value={code} disabled readOnly />
              <FieldDescription>Se genera automáticamente al crear.</FieldDescription>
            </Field>
          </FormFieldCell>
        ) : null}

        <FormFieldCell fullWidth>
          <Controller
            name="title"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="ads-message-title">Título</FieldLabel>
                <Input
                  {...field}
                  id="ads-message-title"
                  maxLength={255}
                  autoFocus
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FormFieldCell>

        <FormFieldCell fullWidth>
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="ads-message-description">Descripción</FieldLabel>
                <Textarea
                  {...field}
                  id="ads-message-description"
                  rows={6}
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>Puedes incluir emojis.</FieldDescription>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FormFieldCell>
      </FormSection>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  )
}
