import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from '@broker/ui'
import { Controller, type Control } from 'react-hook-form'
import type { CheckoutOrderFormValues } from '@/hooks/use-checkout-order'

type CustomerFormProps = {
  control: Control<CheckoutOrderFormValues>
}

export function CustomerForm({ control }: CustomerFormProps) {
  return (
    <FieldGroup>
      <Controller
        name="customer.name"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="checkout-customer-name">Nombre</FieldLabel>
            <Input
              {...field}
              id="checkout-customer-name"
              maxLength={255}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid ? (
              <FieldError errors={[fieldState.error]} />
            ) : null}
          </Field>
        )}
      />
      <Controller
        name="customer.phone"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="checkout-customer-phone">Teléfono</FieldLabel>
            <Input
              {...field}
              id="checkout-customer-phone"
              type="tel"
              maxLength={32}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid ? (
              <FieldError errors={[fieldState.error]} />
            ) : null}
          </Field>
        )}
      />
      <Controller
        name="customer.identification"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="checkout-customer-identification">
              Identificación
            </FieldLabel>
            <Input
              {...field}
              id="checkout-customer-identification"
              maxLength={64}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid ? (
              <FieldError errors={[fieldState.error]} />
            ) : null}
          </Field>
        )}
      />
    </FieldGroup>
  )
}
