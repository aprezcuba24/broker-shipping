import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from '@broker/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import { forwardRef, useImperativeHandle } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

export const checkoutFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  customer_phone: z
    .string()
    .trim()
    .min(1, 'El teléfono es obligatorio')
    .max(32, 'Máximo 32 caracteres'),
})

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>

export type CartCheckoutFormHandle = {
  trigger: () => Promise<boolean>
  getValues: () => CheckoutFormValues
}

export const CartCheckoutForm = forwardRef<CartCheckoutFormHandle>(
  function CartCheckoutForm(_props, ref) {
    const form = useForm<CheckoutFormValues>({
      resolver: zodResolver(checkoutFormSchema),
      defaultValues: {
        name: '',
        customer_phone: '',
      },
      mode: 'onTouched',
    })

    useImperativeHandle(ref, () => ({
      trigger: () => form.trigger(),
      getValues: () => form.getValues(),
    }))

    return (
      <form
        className="space-y-4"
        onSubmit={(event) => event.preventDefault()}
      >
        <FieldGroup>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="checkout-order-name">
                  Nombre del pedido
                </FieldLabel>
                <Input
                  {...field}
                  id="checkout-order-name"
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
            name="customer_phone"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="checkout-customer-phone">
                  Teléfono del cliente
                </FieldLabel>
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
        </FieldGroup>
      </form>
    )
  },
)
