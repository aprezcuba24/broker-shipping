import {
  brokerFetch,
  type CustomerSummary,
} from '@broker/api'
import {
  Button,
  EntityAutocomplete,
  Field,
  FieldError,
  FieldLabel,
} from '@broker/ui'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Controller, type Control } from 'react-hook-form'
import type { CheckoutOrderFormValues } from '@/hooks/use-checkout-order'

type ExistingCustomerPickerProps = {
  control: Control<CheckoutOrderFormValues>
  selectedCustomer: CustomerSummary | null
  onCustomerSelect: (customer: CustomerSummary | null) => void
}

export function ExistingCustomerPicker({
  control,
  selectedCustomer,
  onCustomerSelect,
}: ExistingCustomerPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const trimmedQuery = searchQuery.trim()
  const canSearch = trimmedQuery.length >= 1

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['/orders/customers/', trimmedQuery],
    queryFn: ({ signal }) =>
      brokerFetch<CustomerSummary[]>({
        url: '/orders/customers/',
        method: 'GET',
        params: { q: trimmedQuery },
        signal,
      }),
    enabled: canSearch,
  })

  const clearSelection = (onChange: (value: string) => void) => {
    onChange('')
    onCustomerSelect(null)
    setSearchQuery('')
  }

  return (
    <Controller
      name="customerId"
      control={control}
      render={({ field, fieldState }) =>
        selectedCustomer ? (
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              <p className="font-medium text-foreground">
                {selectedCustomer.name}
              </p>
              <p className="text-muted-foreground">{selectedCustomer.phone}</p>
              <p className="text-muted-foreground">
                {selectedCustomer.identification}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => clearSelection(field.onChange)}
            >
              Cambiar cliente
            </Button>
            {fieldState.invalid ? (
              <FieldError errors={[fieldState.error]} />
            ) : null}
          </div>
        ) : (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="checkout-existing-customer">Cliente</FieldLabel>
            <EntityAutocomplete<CustomerSummary>
              items={customers}
              value={field.value}
              onValueChange={field.onChange}
              onItemSelect={onCustomerSelect}
              onSearchChange={setSearchQuery}
              isLoading={isLoading}
              id="checkout-existing-customer"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              aria-invalid={fieldState.invalid}
              placeholder="Buscar por nombre, teléfono o identificación…"
              emptyMessage="No se encontraron clientes."
              renderItem={(customer) => (
                <>
                  <span className="font-medium text-foreground">
                    {customer.name}
                  </span>
                  <span className="text-muted-foreground">
                    {customer.phone} · {customer.identification}
                  </span>
                </>
              )}
            />
            {fieldState.invalid ? (
              <FieldError errors={[fieldState.error]} />
            ) : null}
          </Field>
        )
      }
    />
  )
}
