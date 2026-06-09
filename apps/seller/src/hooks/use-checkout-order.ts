import { createOrderOrdersPost, formatApiError } from '@broker/api'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useCartStore } from '@/stores/cart-store'

const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  phone: z
    .string()
    .trim()
    .min(1, 'El teléfono es obligatorio')
    .max(32, 'Máximo 32 caracteres'),
  identification: z
    .string()
    .trim()
    .min(1, 'La identificación es obligatoria')
    .max(64, 'Máximo 64 caracteres'),
})

const addressSchema = z.object({
  province: z
    .string()
    .trim()
    .min(1, 'La provincia es obligatoria')
    .max(255, 'Máximo 255 caracteres'),
  municipality: z
    .string()
    .trim()
    .min(1, 'El municipio es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  district: z
    .string()
    .trim()
    .min(1, 'El distrito es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  neighborhood: z
    .string()
    .trim()
    .min(1, 'El reparto es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  address: z
    .string()
    .trim()
    .min(1, 'La dirección es obligatoria')
    .max(255, 'Máximo 255 caracteres'),
  reference: z
    .string()
    .trim()
    .max(255, 'Máximo 255 caracteres')
    .optional()
    .or(z.literal('')),
})

export const checkoutOrderSchema = z.object({
  customer: customerSchema,
  address: addressSchema,
})

export type CheckoutOrderFormValues = z.infer<typeof checkoutOrderSchema>

const defaultValues: CheckoutOrderFormValues = {
  customer: {
    name: '',
    phone: '',
    identification: '',
  },
  address: {
    province: '',
    municipality: '',
    district: '',
    neighborhood: '',
    address: '',
    reference: '',
  },
}

export function useCheckoutOrder() {
  const navigate = useNavigate()
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const form = useForm<CheckoutOrderFormValues>({
    resolver: zodResolver(checkoutOrderSchema),
    defaultValues,
    mode: 'onTouched',
  })

  const validate = useCallback(async () => {
    return form.trigger()
  }, [form])

  const submitOrder = useCallback(() => {
    const values = form.getValues()
    const { lines } = useCartStore.getState()

    setSubmitError(null)

    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          const order = await createOrderOrdersPost({
            name: values.customer.name,
            customer: values.customer,
            address: {
              ...values.address,
              reference: values.address.reference?.trim() || undefined,
            },
            lines: lines.map((line) => ({
              product_id: line.product_id,
              quantity: line.quantity,
              price: line.price,
            })),
          })

          useCartStore.getState().clearCart()
          void navigate(`/orders/${order.id}`)
          resolve()
        } catch (error) {
          setSubmitError(formatApiError(error))
          setIsConfirmOpen(false)
          reject(error)
        }
      })
    })
  }, [form, navigate, startTransition])

  const handleConfirmOpenChange = useCallback((open: boolean) => {
    if (!open) setSubmitError(null)
    setIsConfirmOpen(open)
  }, [])

  return {
    form,
    isSubmitting: isPending,
    submitError,
    isConfirmOpen,
    setIsConfirmOpen,
    handleConfirmOpenChange,
    validate,
    submitOrder,
  }
}
