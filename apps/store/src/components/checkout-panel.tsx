import {
  checkoutStorefrontCheckoutPost,
  formatApiError,
  phoneSchema,
} from '@broker/api'
import { zodResolver } from '@hookform/resolvers/zod'
import { formatMoney, PhoneInput } from '@broker/ui'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { PayOnDeliveryNote } from '@/components/pay-on-delivery-note'
import { StoreLocationFields } from '@/components/store-location-fields'
import { SELLER_ORGANIZATION_ID } from '@/config/env'
import {
  buildWhatsAppUrl,
  type CheckoutFormValues,
  type CompletedCheckout,
} from '@/lib/checkout'
import {
  cartTotalsByCurrency,
  useCartStore,
} from '@/stores/cart-store'

const checkoutSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Escribe tu nombre.')
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
    .min(1, 'Escribe la dirección de entrega.')
    .max(500, 'Máximo 500 caracteres'),
  province_id: z.string().uuid('Selecciona una provincia'),
  municipality_id: z.string().uuid('Selecciona un municipio'),
  neighborhood_id: z.string().uuid('Selecciona un barrio'),
})

type CheckoutPanelProps = {
  open: boolean
  onClose: () => void
  onBackToCart: () => void
  onCompleted: (payload: CompletedCheckout) => void
}

export function CheckoutPanel({
  open,
  onClose,
  onBackToCart,
  onCompleted,
}: CheckoutPanelProps) {
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const totals = cartTotalsByCurrency(items)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const totalLabel =
    totals.length > 0
      ? totals.map((money) => formatMoney(money)).join(' + ')
      : formatMoney({ amount: 0, currency: 'usd' })

  return (
    <aside
      className={`store-panel${open ? ' open' : ''}`}
      aria-label="Datos del pedido"
      aria-hidden={!open}
    >
      <div className="store-ph">
        <h2>Datos de entrega</h2>
        <button type="button" className="store-btn ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>
      <form
        className="store-form-contents"
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
            form.reset()
            onCompleted({ order, values })
          } catch (caught) {
            setError(formatApiError(caught))
          } finally {
            setIsSubmitting(false)
          }
        })}
      >
        <div className="store-pb">
          <PayOnDeliveryNote style={{ marginBottom: '1rem' }}>
            Pago contra entrega: pagas cuando el libro llegue.
          </PayOnDeliveryNote>

          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <label className="store-field">
                Nombre completo
                <input {...field} autoComplete="name" />
                <span className="store-err">{fieldState.error?.message}</span>
              </label>
            )}
          />

          <Controller
            control={form.control}
            name="ci"
            render={({ field, fieldState }) => (
              <label className="store-field">
                Carnet de identidad
                <input {...field} autoComplete="off" />
                <span className="store-err">{fieldState.error?.message}</span>
              </label>
            )}
          />

          <Controller
            control={form.control}
            name="phone"
            render={({ field, fieldState }) => (
              <label className="store-field">
                Teléfono
                <PhoneInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
                <span className="store-err">{fieldState.error?.message}</span>
              </label>
            )}
          />

          <Controller
            control={form.control}
            name="address"
            render={({ field, fieldState }) => (
              <label className="store-field">
                Dirección de entrega
                <textarea
                  {...field}
                  rows={3}
                  autoComplete="street-address"
                  placeholder="Calle, número, apartamento, punto de referencia"
                />
                <span className="store-err">{fieldState.error?.message}</span>
              </label>
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

          {error ? <p className="store-err">{error}</p> : null}
        </div>
        <div className="store-pf">
          <div className="store-total">
            <span>Total</span>
            <span>{totalLabel}</span>
          </div>
          <button
            type="submit"
            className="store-btn wide gold"
            disabled={isSubmitting || items.length === 0}
          >
            {isSubmitting ? 'Registrando…' : 'Registrar pedido'}
          </button>
          <button
            type="button"
            className="store-btn ghost"
            onClick={onBackToCart}
          >
            Volver al carrito
          </button>
        </div>
      </form>
    </aside>
  )
}

type DonePanelProps = {
  open: boolean
  onClose: () => void
  completed: CompletedCheckout
}

export function DonePanel({ open, onClose, completed }: DonePanelProps) {
  const whatsappUrl = buildWhatsAppUrl(completed)

  return (
    <aside
      className={`store-panel${open ? ' open' : ''}`}
      aria-label="Pedido registrado"
      aria-hidden={!open}
    >
      <div className="store-ph">
        <h2>Pedido registrado</h2>
        <button type="button" className="store-btn ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>
      <div className="store-pb store-done">
        <div className="check">✓</div>
        <h3
          style={{
            font: '700 1.4rem var(--serif)',
            margin: '0 0 .3rem',
            color: 'var(--ink)',
          }}
        >
          Pedido {completed.order.code}
        </h3>
        <p style={{ color: 'var(--muted)', margin: '0 0 1rem' }}>
          Último paso: escríbele al vendedor por WhatsApp para confirmar la
          entrega.
        </p>
        <PayOnDeliveryNote style={{ textAlign: 'left' }}>
          Recuerda: <b>pagas cuando recibas tu libro</b>. No necesitas pagar nada
          antes.
        </PayOnDeliveryNote>
      </div>
      <div className="store-pf">
        <a
          className="store-wa"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Contactar al vendedor por WhatsApp
        </a>
      </div>
    </aside>
  )
}
