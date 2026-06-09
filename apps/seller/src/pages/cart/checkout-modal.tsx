import { formatApiError } from '@broker/api'
import { ButtonModal } from '@broker/ui'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@/stores/cart-store'
import {
  CartCheckoutForm,
  type CartCheckoutFormHandle,
} from './checkout-form'

type CheckoutModalProps = {
  disabled?: boolean
}

export function CheckoutModal({ disabled = false }: CheckoutModalProps) {
  const navigate = useNavigate()
  const checkoutFormRef = useRef<CartCheckoutFormHandle>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const createOrder = useCartStore((state) => state.createOrder)

  const handleAccept = async () => {
    const isValid = await checkoutFormRef.current?.trigger()
    if (!isValid) throw new Error('Validation failed')

    const values = checkoutFormRef.current!.getValues()

    setIsCreating(true)
    setCreateError(null)

    try {
      const order = await createOrder(values)
      void navigate(`/orders/${order.id}`)
    } catch (error) {
      setCreateError(formatApiError(error))
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) setCreateError(null)
  }

  return (
    <ButtonModal
      label="Crear orden al cliente"
      title="Crear orden al cliente"
      acceptLabel="Crear orden al cliente"
      isLoading={isCreating}
      disabled={disabled}
      onAccept={handleAccept}
      onOpenChange={handleOpenChange}
    >
      <CartCheckoutForm ref={checkoutFormRef} />
      {createError ? (
        <p className="text-sm text-destructive">{createError}</p>
      ) : null}
    </ButtonModal>
  )
}
