import {
  createOrderOrdersSellerPost,
  formatApiError,
  registerCustomerCustomersSellerRegisterPost,
  type CreateOrderOrdersSellerPostParams,
  type OrderItemPublic,
  type RegisterCustomerCustomersSellerRegisterPostParams,
} from '@broker/api'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useCart } from '@/hooks/use-cart'
import type { CustomerFormValues } from '@/pages/customer/form'

export function useRegisterOrder(
  previewByProductId: Map<string, OrderItemPublic>,
) {
  const navigate = useNavigate()
  const { items, clearCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const registerOrder = useCallback(
    async (values: CustomerFormValues) => {
      setIsSubmitting(true)
      setError(null)
      try {
        const orderItems = items.map((item) => {
          const preview = previewByProductId.get(item.product.id)
          if (!preview) {
            throw new Error(
              'Los precios del carrito no están listos. Espera un momento e inténtalo de nuevo.',
            )
          }
          return {
            product_id: item.product.id,
            quantity: item.quantity,
            seller_provider_price: preview.seller_provider_price,
          }
        })

        if (orderItems.length === 0) {
          throw new Error('El carrito está vacío.')
        }

        const customer = await registerCustomerCustomersSellerRegisterPost(
          {
            name: values.name,
            ci: values.ci,
            phone: values.phone,
            address: {
              address: values.address,
              province_id: values.province_id,
              municipality_id: values.municipality_id,
            },
          },
          {} as RegisterCustomerCustomersSellerRegisterPostParams,
        )

        const order = await createOrderOrdersSellerPost(
          {
            customer_id: customer.id,
            items: orderItems,
          },
          {} as CreateOrderOrdersSellerPostParams,
        )

        clearCart()
        navigate(`/orders/${order.id}`)
      } catch (caught) {
        setError(formatApiError(caught))
        throw caught
      } finally {
        setIsSubmitting(false)
      }
    },
    [clearCart, items, navigate, previewByProductId],
  )

  return { registerOrder, isSubmitting, error, setError }
}
