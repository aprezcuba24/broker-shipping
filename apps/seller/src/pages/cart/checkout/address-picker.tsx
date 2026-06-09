import { useGetCustomerOrdersCustomersCustomerIdGet } from '@broker/api'
import { AddressShow, Button, cn, FieldError } from '@broker/ui'
import { useEffect, useMemo } from 'react'
import { Controller, type Control, useFormContext } from 'react-hook-form'
import {
  type CheckoutOrderFormValues,
} from '@/hooks/use-checkout-order'
import { AddressForm } from './address-form'

type AddressPickerProps = {
  control: Control<CheckoutOrderFormValues>
  customerId: string
}

export function AddressPicker({ control, customerId }: AddressPickerProps) {
  const { setValue, watch, clearErrors } = useFormContext<CheckoutOrderFormValues>()
  const addressSource = watch('addressSource')
  const addressId = watch('addressId')

  const { data: customerDetail, isLoading } =
    useGetCustomerOrdersCustomersCustomerIdGet(customerId, {
      query: { enabled: Boolean(customerId) },
    })

  const addresses = useMemo(
    () => customerDetail?.addresses ?? [],
    [customerDetail?.addresses],
  )
  const hasSavedAddresses = addresses.length > 0

  useEffect(() => {
    if (!customerId || isLoading) return

    if (!hasSavedAddresses) {
      setValue('addressSource', 'new', { shouldDirty: true })
      setValue('addressId', '', { shouldDirty: true })
      return
    }

    if (addressSource === 'new') return

    const activeAddress = addresses.find((address) => address.is_active)
    const defaultAddressId = activeAddress?.id ?? addresses[0]?.id ?? ''
    if (!addressId && defaultAddressId) {
      setValue('addressId', defaultAddressId, { shouldDirty: true })
    }
  }, [
    addressId,
    addressSource,
    addresses,
    customerId,
    hasSavedAddresses,
    isLoading,
    setValue,
  ])

  const handleAddressSourceChange = (source: 'saved' | 'new') => {
    setValue('addressSource', source, { shouldDirty: true })
    clearErrors(['addressId', 'address'])
    if (source === 'saved') {
      const activeAddress = addresses.find((address) => address.is_active)
      setValue('addressId', activeAddress?.id ?? addresses[0]?.id ?? '', {
        shouldDirty: true,
      })
    } else {
      setValue('addressId', '', { shouldDirty: true })
    }
  }

  return (
    <div className="space-y-4">
      {hasSavedAddresses ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={addressSource === 'saved' ? 'default' : 'outline'}
            size="sm"
            className={cn(addressSource === 'saved' && 'pointer-events-none')}
            onClick={() => handleAddressSourceChange('saved')}
          >
            Dirección guardada
          </Button>
          <Button
            type="button"
            variant={addressSource === 'new' ? 'default' : 'outline'}
            size="sm"
            className={cn(addressSource === 'new' && 'pointer-events-none')}
            onClick={() => handleAddressSourceChange('new')}
          >
            Nueva dirección
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Este cliente no tiene direcciones guardadas. Ingresa una nueva
          dirección de entrega.
        </p>
      )}

      {addressSource === 'saved' && hasSavedAddresses ? (
        <Controller
          name="addressId"
          control={control}
          render={({ field, fieldState }) => (
            <div className="space-y-2">
              <div className="space-y-2">
                {addresses.map((address) => {
                  const isSelected = field.value === address.id
                  return (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => field.onChange(address.id)}
                      className={cn(
                        'w-full rounded-lg border p-3 text-left text-sm transition-colors',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/40',
                      )}
                    >
                      <AddressShow address={address} />
                    </button>
                  )
                })}
              </div>
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </div>
          )}
        />
      ) : (
        <AddressForm control={control} idPrefix="checkout-existing" />
      )}
    </div>
  )
}
