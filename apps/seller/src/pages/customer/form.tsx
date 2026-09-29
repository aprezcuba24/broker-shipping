import {
  listCustomersCustomersSellerGet,
  type CustomerPublic,
  type ListCustomersCustomersSellerGetParams,
} from '@broker/api'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import {
  Field,
  FieldError,
  FieldLabel,
  FormFieldCell,
  FormSection,
  Input,
  LocationFields,
  Textarea,
  type EntityFormHandle,
  type EntityFormProps,
  type LocationFieldsHandle,
} from '@broker/ui'

export const customerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
  ci: z
    .string()
    .trim()
    .min(1, 'El CI es obligatorio')
    .max(50, 'Máximo 50 caracteres'),
  phone: z
    .string()
    .trim()
    .min(1, 'El teléfono es obligatorio')
    .max(50, 'Máximo 50 caracteres'),
  address: z
    .string()
    .trim()
    .min(1, 'La dirección es obligatoria')
    .max(500, 'Máximo 500 caracteres'),
  province_id: z.string().uuid('Selecciona una provincia'),
  municipality_id: z.string().uuid('Selecciona un municipio'),
  neighborhood_id: z.string().uuid('Selecciona un barrio'),
})

export type CustomerFormValues = z.infer<typeof customerFormSchema>

export const customerFormDefaultValues: CustomerFormValues = {
  name: '',
  ci: '',
  phone: '',
  address: '',
  province_id: '',
  municipality_id: '',
  neighborhood_id: '',
}

type LookupStatus = 'idle' | 'searching' | 'found' | 'not_found' | 'error'

function toPhoneDigits(value: string): string {
  return value.trim().replace(/^\+/, '').replace(/\D/g, '')
}

/** Complete local (8) or full (10+) number — backend normalizes 8-digit to 53… */
function isPhoneReadyForLookup(digits: string): boolean {
  return digits.length === 8 || digits.length >= 10
}

function applyCustomerToForm(
  setValue: ReturnType<typeof useForm<CustomerFormValues>>['setValue'],
  customer: CustomerPublic,
  locationRef: RefObject<LocationFieldsHandle | null>,
) {
  setValue('name', customer.name, { shouldDirty: true, shouldValidate: false })
  setValue('ci', customer.ci, { shouldDirty: true, shouldValidate: false })
  setValue('address', customer.address?.address ?? '', {
    shouldDirty: true,
    shouldValidate: false,
  })
  locationRef.current?.applySelection({
    province_id: customer.address?.province_id ?? '',
    province_name: customer.address?.province_name,
    municipality_id: customer.address?.municipality_id ?? '',
    municipality_name: customer.address?.municipality_name,
    neighborhood_id: customer.address?.neighborhood_id ?? '',
    neighborhood_name: customer.address?.neighborhood_name,
  })
}

export function CustomerForm({
  ref,
  defaultValues = customerFormDefaultValues,
  onSubmit,
  isSubmitting = false,
  error = null,
}: EntityFormProps<CustomerFormValues>) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues,
  })

  const [detailsUnlocked, setDetailsUnlocked] = useState(false)
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle')

  const lastLookedUpPhoneRef = useRef<string | null>(null)
  const lookupSeqRef = useRef(0)
  const locationRef = useRef<LocationFieldsHandle>(null)

  const phoneValue = useWatch({ control: form.control, name: 'phone' })

  useImperativeHandle(ref, (): EntityFormHandle => ({
    submit: async () => {
      if (!detailsUnlocked) {
        form.setError('phone', {
          type: 'manual',
          message: 'Introduce un teléfono válido para continuar',
        })
        throw new Error('validation')
      }
      await form.handleSubmit(
        async (values) => {
          await onSubmit(values)
        },
        () => {
          throw new Error('validation')
        },
      )()
    },
  }))

  const clearCustomerDetails = () => {
    locationRef.current?.clearSelection()
    form.setValue('name', '', { shouldDirty: false, shouldValidate: false })
    form.setValue('ci', '', { shouldDirty: false, shouldValidate: false })
    form.setValue('address', '', { shouldDirty: false, shouldValidate: false })
    form.clearErrors([
      'name',
      'ci',
      'address',
      'province_id',
      'municipality_id',
      'neighborhood_id',
    ])
  }

  const runLookup = async (digits: string) => {
    if (!digits) return
    if (digits === lastLookedUpPhoneRef.current) return

    const seq = ++lookupSeqRef.current
    setDetailsUnlocked(false)
    clearCustomerDetails()
    setLookupStatus('searching')
    form.clearErrors('phone')

    try {
      const page = await listCustomersCustomersSellerGet({
        phone: digits,
        page: 1,
        page_size: 1,
      } as ListCustomersCustomersSellerGetParams)

      if (seq !== lookupSeqRef.current) return

      lastLookedUpPhoneRef.current = digits
      const customer = page.items[0]
      if (customer) {
        applyCustomerToForm(form.setValue, customer, locationRef)
        setLookupStatus('found')
      } else {
        setLookupStatus('not_found')
      }
      setDetailsUnlocked(true)
    } catch {
      if (seq !== lookupSeqRef.current) return
      lastLookedUpPhoneRef.current = digits
      setLookupStatus('error')
      setDetailsUnlocked(true)
    }
  }

  useEffect(() => {
    const digits = toPhoneDigits(phoneValue ?? '')

    if (lastLookedUpPhoneRef.current !== null && digits !== lastLookedUpPhoneRef.current) {
      lookupSeqRef.current += 1
      lastLookedUpPhoneRef.current = null
      setDetailsUnlocked(false)
      clearCustomerDetails()
      setLookupStatus('idle')
    }

    if (!isPhoneReadyForLookup(digits)) return

    const timer = window.setTimeout(() => {
      void runLookup(digits)
    }, 450)

    return () => window.clearTimeout(timer)
    // Intentionally depend only on phoneValue; helpers close over latest form.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- phone-driven lookup
  }, [phoneValue])

  const detailsDisabled = isSubmitting || !detailsUnlocked

  const lookupHint =
    lookupStatus === 'searching'
      ? 'Buscando cliente…'
      : lookupStatus === 'found'
        ? 'Cliente encontrado. Revisa los datos.'
        : lookupStatus === 'not_found'
          ? 'No hay un cliente con este teléfono. Completa los datos.'
          : lookupStatus === 'error'
            ? 'No se pudo buscar el cliente. Completa los datos.'
            : null

  return (
    <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
      <FormSection>
        <FormFieldCell fullWidth>
          <Controller
            name="phone"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="customer-phone">Teléfono</FieldLabel>
                <Input
                  {...field}
                  id="customer-phone"
                  maxLength={50}
                  inputMode="tel"
                  autoFocus
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                  onBlur={() => {
                    field.onBlur()
                    const digits = toPhoneDigits(field.value)
                    if (digits.length >= 8) {
                      void runLookup(digits)
                    }
                  }}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
                {lookupHint && !fieldState.invalid ? (
                  <p
                    className={
                      lookupStatus === 'error'
                        ? 'text-sm text-destructive'
                        : 'text-sm text-muted-foreground'
                    }
                  >
                    {lookupHint}
                  </p>
                ) : null}
              </Field>
            )}
          />
        </FormFieldCell>

        <FormFieldCell fullWidth>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="customer-name">Nombre</FieldLabel>
                <Input
                  {...field}
                  id="customer-name"
                  maxLength={255}
                  disabled={detailsDisabled}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FormFieldCell>

        <FormFieldCell fullWidth>
          <Controller
            name="ci"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="customer-ci">CI</FieldLabel>
                <Input
                  {...field}
                  id="customer-ci"
                  maxLength={50}
                  disabled={detailsDisabled}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FormFieldCell>

        <FormFieldCell fullWidth>
          <Controller
            name="address"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="customer-address">Dirección</FieldLabel>
                <Textarea
                  {...field}
                  id="customer-address"
                  maxLength={500}
                  rows={2}
                  disabled={detailsDisabled}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FormFieldCell>

        <LocationFields
          ref={locationRef}
          control={form.control}
          setValue={form.setValue}
          provinceName="province_id"
          municipalityName="municipality_id"
          neighborhoodName="neighborhood_id"
          disabled={detailsDisabled}
        />
      </FormSection>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  )
}
