import { useGetCustomerOrdersCustomersCustomerIdGet } from '@broker/api'
import { AddressShow, cn, FieldError, Tabs, TabsContent, TabsList, TabsTrigger } from '@broker/ui'
import { useEffect, useMemo } from 'react'
import { Controller, type Control, useFormContext } from 'react-hook-form'
import { type CheckoutOrderFormValues } from '@/hooks/use-checkout-order'
import { AddressForm } from './address-form'

type AddressPickerProps = {
  control: Control<CheckoutOrderFormValues>
  customerId: string
}

export function AddressPicker({ control, customerId }: AddressPickerProps) {
  const { setValue, watch, clearErrors } = useFormContext<CheckoutOrderFormValues>()
  const addressSource = watch('addressSource')
  const addressId = watch('addressId')

  const { data: customerDetail, isLoading } = useGetCustomerOrdersCustomersCustomerIdGet(
    customerId,
    {
      query: { enabled: Boolean(customerId) },
    },
  )

  const addresses = useMemo(() => customerDetail?.addresses ?? [], [customerDetail?.addresses])

  useEffect(() => {
    if (!customerId || isLoading || addressSource === 'new') return

    const activeAddress = addresses.find((address) => address.is_active)
    const defaultAddressId = activeAddress?.id ?? addresses[0]?.id ?? ''
    if (!addressId && defaultAddressId) {
      setValue('addressId', defaultAddressId, { shouldDirty: true })
    }
  }, [addressId, addressSource, addresses, customerId, isLoading, setValue])

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
      <Tabs
        value={addressSource}
        onValueChange={(value) => handleAddressSourceChange(value as 'saved' | 'new')}
      >
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
          <TabsTrigger value="saved">Dirección guardada</TabsTrigger>
          <TabsTrigger value="new">Nueva dirección</TabsTrigger>
        </TabsList>
        <TabsContent value="saved">
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
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </div>
            )}
          />
        </TabsContent>
        <TabsContent value="new">
          <AddressForm control={control} idPrefix="checkout-new" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
