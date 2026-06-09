import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Textarea,
} from '@broker/ui'
import { Controller, type Control } from 'react-hook-form'
import type { CheckoutOrderFormValues } from '@/hooks/use-checkout-order'

type AddressFormProps = {
  control: Control<CheckoutOrderFormValues>
}

export function AddressForm({ control }: AddressFormProps) {
  return (
    <FieldGroup>
      <Controller
        name="address.province"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="checkout-address-province">Provincia</FieldLabel>
            <Input
              {...field}
              id="checkout-address-province"
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
        name="address.municipality"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="checkout-address-municipality">
              Municipio
            </FieldLabel>
            <Input
              {...field}
              id="checkout-address-municipality"
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
        name="address.district"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="checkout-address-district">Distrito</FieldLabel>
            <Input
              {...field}
              id="checkout-address-district"
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
        name="address.neighborhood"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="checkout-address-neighborhood">
              Reparto / barrio
            </FieldLabel>
            <Input
              {...field}
              id="checkout-address-neighborhood"
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
        name="address.address"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="checkout-address-street">Dirección</FieldLabel>
            <Input
              {...field}
              id="checkout-address-street"
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
        name="address.reference"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="checkout-address-reference">
              Referencia (opcional)
            </FieldLabel>
            <Textarea
              {...field}
              id="checkout-address-reference"
              maxLength={255}
              rows={2}
              value={field.value ?? ''}
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
