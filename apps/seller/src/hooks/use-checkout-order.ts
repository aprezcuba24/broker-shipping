import { formatApiError, type CustomerSummary, createOrder, type OrderCreate } from '@broker/api'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useCartStore } from '@/stores/cart-store'
import { checkoutOrderSchema } from '@/schemas/checkout'

export type CheckoutMode = 'new' | 'existing'
export type AddressSource = 'saved' | 'new'

export type CheckoutOrderFormValues = z.infer<typeof checkoutOrderSchema>

const emptyAddress: CheckoutOrderFormValues['address'] = {
  province: '',
  municipality: '',
  district: '',
  neighborhood: '',
  address: '',
  reference: '',
}

const defaultValues: CheckoutOrderFormValues = {
  mode: 'new',
  customer: {
    name: '',
    phone: '',
    identification: '',
  },
  customerId: '',
  addressSource: 'saved',
  addressId: '',
  address: emptyAddress,
}

export function useCheckoutOrder() {
  const navigate = useNavigate()
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null)

  const form = useForm<CheckoutOrderFormValues>({
    resolver: zodResolver(checkoutOrderSchema),
    defaultValues,
    mode: 'onTouched',
  })

  const mode = form.watch('mode')

  const setMode = useCallback(
    (nextMode: CheckoutMode) => {
      form.setValue('mode', nextMode, { shouldDirty: true })
      form.clearErrors()

      if (nextMode === 'new') {
        setSelectedCustomer(null)
        form.setValue('customerId', '')
        form.setValue('addressId', '')
        form.setValue('addressSource', 'saved')
        return
      }

      form.setValue('customer', defaultValues.customer)
      form.setValue('address', emptyAddress)
    },
    [form],
  )

  const handleCustomerSelect = useCallback(
    (customer: CustomerSummary | null) => {
      setSelectedCustomer(customer)
      form.setValue('customerId', customer?.id ?? '', { shouldDirty: true })
      form.setValue('addressId', '', { shouldDirty: true })
      form.setValue('address', emptyAddress, { shouldDirty: true })
      form.setValue('addressSource', 'saved', { shouldDirty: true })
      form.clearErrors(['customerId', 'addressId', 'address'])
    },
    [form],
  )

  const validate = useCallback(async () => {
    const fields: (keyof CheckoutOrderFormValues)[] =
      form.getValues('mode') === 'new'
        ? ['customer', 'address']
        : form.getValues('addressSource') === 'saved'
          ? ['customerId', 'addressId']
          : ['customerId', 'address']

    return form.trigger(fields)
  }, [form])

  const submitOrder = useCallback(() => {
    const values = form.getValues()
    const { lines } = useCartStore.getState()

    setSubmitError(null)

    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          const order = await createOrder(values as unknown as OrderCreate, lines)
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
  }, [form, navigate, selectedCustomer?.name, startTransition])

  const handleConfirmOpenChange = useCallback((open: boolean) => {
    if (!open) setSubmitError(null)
    setIsConfirmOpen(open)
  }, [])

  return {
    form,
    mode,
    setMode,
    selectedCustomer,
    handleCustomerSelect,
    isSubmitting: isPending,
    submitError,
    isConfirmOpen,
    setIsConfirmOpen,
    handleConfirmOpenChange,
    validate,
    submitOrder,
  }
}
