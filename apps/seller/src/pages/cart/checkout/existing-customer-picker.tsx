import {
  brokerFetch,
  type CustomerSummary,
} from '@broker/api'
import {
  Button,
  Field,
  FieldError,
  FieldLabel,
  Input,
} from '@broker/ui'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useId, useRef, useState } from 'react'
import { Controller, type Control } from 'react-hook-form'
import type { CheckoutOrderFormValues } from '@/hooks/use-checkout-order'

type ExistingCustomerPickerProps = {
  control: Control<CheckoutOrderFormValues>
  selectedCustomer: CustomerSummary | null
  onCustomerSelect: (customer: CustomerSummary | null) => void
}

const DEBOUNCE_MS = 300

export function ExistingCustomerPicker({
  control,
  selectedCustomer,
  onCustomerSelect,
}: ExistingCustomerPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(inputValue)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [inputValue])

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  const trimmedQuery = debouncedQuery.trim()
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
    setInputValue('')
    setDebouncedQuery('')
    setIsOpen(false)
  }

  const selectCustomer = (
    customer: CustomerSummary,
    onChange: (value: string) => void,
  ) => {
    onChange(customer.id)
    onCustomerSelect(customer)
    setInputValue(customer.name)
    setIsOpen(false)
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
          <div ref={containerRef} className="relative">
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="checkout-existing-customer">Cliente</FieldLabel>
              <Input
                id="checkout-existing-customer"
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={inputValue}
                role="combobox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-invalid={fieldState.invalid}
                autoComplete="off"
                placeholder="Buscar por nombre, teléfono o identificación…"
                onChange={(event) => {
                  setInputValue(event.target.value)
                  setIsOpen(true)
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setIsOpen(false)
                  }
                }}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>

            {isOpen ? (
              <ul
                id={listboxId}
                role="listbox"
                className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-background py-1 shadow-md"
              >
                {!canSearch ? (
                  <li
                    role="presentation"
                    className="px-3 py-2 text-sm text-muted-foreground"
                  >
                    Escribe para buscar
                  </li>
                ) : isLoading ? (
                  <li
                    role="presentation"
                    className="px-3 py-2 text-sm text-muted-foreground"
                  >
                    Buscando…
                  </li>
                ) : customers.length === 0 ? (
                  <li
                    role="presentation"
                    className="px-3 py-2 text-sm text-muted-foreground"
                  >
                    No se encontraron clientes.
                  </li>
                ) : (
                  customers.map((customer) => (
                    <li key={customer.id} role="option">
                      <button
                        type="button"
                        className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() =>
                          selectCustomer(customer, field.onChange)
                        }
                      >
                        <span className="font-medium text-foreground">
                          {customer.name}
                        </span>
                        <span className="text-muted-foreground">
                          {customer.phone} · {customer.identification}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </div>
        )
      }
    />
  )
}
