import {
  checkoutStorefrontCheckoutPost,
  formatApiError,
  phoneSchema,
  type StorefrontCheckoutPublic,
} from '@broker/api'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Field,
  FieldError,
  FieldLabel,
  formatMoney,
  Input,
  PhoneInput,
  Textarea,
} from '@broker/ui'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Link, Navigate } from 'react-router-dom'
import { z } from 'zod'

import { PayOnDeliveryNote } from '@/components/pay-on-delivery-note'
import { SaleFlow } from '@/components/sale-flow'
import { StoreLocationFields } from '@/components/store-location-fields'
import { SELLER_ORGANIZATION_ID, WHATSAPP_PHONE } from '@/config/env'
import {
  cartTotalsByCurrency,
  useCartStore,
} from '@/stores/cart-store'

const checkoutSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  ci: z
    .string()
    .trim()
    .min(1, 'El carnet es obligatorio')
    .max(50, 'Máximo 50 caracteres'),
  phone: phoneSchema,
  address: z
    .string()
    .trim()
    .min(1, 'La dirección es obligatoria')
    .max(500, 'Máximo 500 caracteres'),
  province_id: z.string().uuid('Selecciona una provincia'),
  municipality_id: z.string().uuid('Selecciona un municipio'),
  neighborhood_id: z.string().uuid('Selecciona un barrio'),
})

type CheckoutFormValues = z.infer<typeof checkoutSchema>

function buildWhatsAppUrl(
  order: StorefrontCheckoutPublic,
  values: CheckoutFormValues,
): string {
  const lines = [
    `Hola, acabo de pedir en la librería.`,
    `Pedido: ${order.code}`,
    '',
    'Libros:',
    ...order.items.map(
      (item) =>
        `· ${item.product_name} × ${item.quantity} — ${formatMoney(item.line_total)}`,
    ),
    '',
    `Total: ${(order.totals ?? []).map((money) => formatMoney(money)).join(' + ')}`,
    '',
    `Nombre: ${values.name}`,
    `Teléfono: ${values.phone}`,
    `CI: ${values.ci}`,
    `Dirección: ${values.address}`,
    '',
    'Pago al recibir los libros.',
  ]
  const text = encodeURIComponent(lines.join('\n'))
  const phone = WHATSAPP_PHONE.replace(/\D/g, '')
  return `https://wa.me/${phone}?text=${text}`
}

export function CheckoutPage() {
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const totals = cartTotalsByCurrency(items)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState<{
    order: StorefrontCheckoutPublic
    values: CheckoutFormValues
  } | null>(null)

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: '',
      ci: '',
      phone: '',
      address: '',
      province_id: '',
      municipality_id: '',
      neighborhood_id: '',
    },
  })

  const provinceId = useWatch({ control: form.control, name: 'province_id' })
  const municipalityId = useWatch({
    control: form.control,
    name: 'municipality_id',
  })

  if (items.length === 0 && !completed) {
    return <Navigate to="/carrito" replace />
  }

  if (completed) {
    const whatsappUrl = buildWhatsAppUrl(completed.order, completed.values)
    return (
      <div className="mx-auto max-w-lg space-y-8 py-8 text-center">
        <div className="space-y-3">
          <p className="text-sm text-[color:var(--ink-muted)]">Pedido registrado</p>
          <p className="font-display text-4xl font-semibold tracking-tight text-[color:var(--spine)] sm:text-5xl">
            {completed.order.code}
          </p>
          <div className="gilt-rule mx-auto max-w-[12rem]" aria-hidden />
          <p className="text-[color:var(--ink-secondary)] leading-relaxed">
            Ahora escribe al vendedor por WhatsApp para coordinar la entrega.
          </p>
        </div>
        <PayOnDeliveryNote className="text-left" />
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              Contactar por WhatsApp
            </a>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Volver al estante</Link>
          </Button>
        </div>
        <div className="gilt-rule" aria-hidden />
        <SaleFlow compact />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
          Tus datos
        </h2>
        <p className="mt-1.5 text-[color:var(--ink-muted)]">
          Con estos datos el vendedor puede llevarte los libros a casa.
        </p>
      </div>

      <PayOnDeliveryNote />

      <form
        className="paper-sheet space-y-5 p-5 sm:p-7"
        onSubmit={form.handleSubmit(async (values) => {
          setIsSubmitting(true)
          setError(null)
          try {
            const order = await checkoutStorefrontCheckoutPost(
              {
                name: values.name,
                ci: values.ci,
                phone: values.phone,
                address: {
                  address: values.address,
                  province_id: values.province_id,
                  municipality_id: values.municipality_id,
                  neighborhood_id: values.neighborhood_id,
                },
                items: items.map((item) => ({
                  product_id: item.book.id,
                  quantity: item.quantity,
                })),
              },
              { organization_id: SELLER_ORGANIZATION_ID },
            )
            clearCart()
            setCompleted({ order, values })
          } catch (caught) {
            setError(formatApiError(caught))
          } finally {
            setIsSubmitting(false)
          }
        })}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Nombre completo</FieldLabel>
                <Input {...field} autoComplete="name" />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="ci"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Carnet de identidad</FieldLabel>
                <Input {...field} autoComplete="off" />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="phone"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel>Teléfono</FieldLabel>
              <PhoneInput
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="address"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel>Dirección</FieldLabel>
              <Textarea
                {...field}
                rows={3}
                placeholder="Calle, número, apartamento, punto de referencia"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <StoreLocationFields
          control={form.control}
          setValue={form.setValue}
          provinceName="province_id"
          municipalityName="municipality_id"
          neighborhoodName="neighborhood_id"
          provinceId={provinceId}
          municipalityId={municipalityId}
        />

        <div className="rounded-md bg-[color:var(--paper-deep)]/70 px-4 py-3.5 text-sm">
          <p className="text-[color:var(--ink-muted)]">Resumen</p>
          <ul className="mt-1.5 space-y-1 text-[color:var(--ink-secondary)]">
            {items.map((item) => (
              <li key={item.book.id}>
                {item.book.name} × {item.quantity}
              </li>
            ))}
          </ul>
          <p className="mt-2.5 font-display text-lg text-[color:var(--spine)]">
            {totals.map((money) => formatMoney(money)).join(' + ')}
          </p>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isSubmitting} size="lg">
            {isSubmitting ? 'Registrando…' : 'Confirmar pedido'}
          </Button>
          <Button asChild type="button" variant="outline">
            <Link to="/carrito">Volver al carrito</Link>
          </Button>
        </div>
      </form>

      <div className="gilt-rule" aria-hidden />
      <SaleFlow compact />
    </div>
  )
}
