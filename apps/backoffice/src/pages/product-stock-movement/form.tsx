import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  StockMovementDirection,
  StockMovementKind,
  useListProductsProductsProviderGet,
  type ListProductsProductsProviderGetParams,
  type ProductPublic,
} from '@broker/api'
import {
  Button,
  EntityAutocomplete,
  EntitySelect,
  Field,
  FieldError,
  FieldLabel,
  FormFieldCell,
  FormSection,
  Input,
  Textarea,
  useFormSubmitHandle,
  type EntityFormProps,
} from '@broker/ui'
import { Plus, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'

import {
  STOCK_MOVEMENT_DIRECTION_OPTIONS,
  STOCK_MOVEMENT_KIND_OPTIONS,
} from './labels'

const movementItemSchema = z.object({
  product_id: z.string().uuid('Selecciona un producto'),
  quantity: z.number().int().gt(0, 'La cantidad debe ser mayor que 0'),
})

export const stockMovementFormSchema = z
  .object({
    kind: z.enum([
      StockMovementKind.reception,
      StockMovementKind.shrinkage,
      StockMovementKind.correction,
    ]),
    direction: z.union([
      z.enum([StockMovementDirection.in, StockMovementDirection.out]),
      z.literal(''),
    ]),
    moved_at: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(movementItemSchema).min(1, 'Añade al menos una línea'),
  })
  .superRefine((values, ctx) => {
    if (values.kind === StockMovementKind.correction && !values.direction) {
      ctx.addIssue({
        code: 'custom',
        path: ['direction'],
        message: 'La dirección es obligatoria para correcciones',
      })
    }

    const seen = new Set<string>()
    values.items.forEach((item, index) => {
      if (!item.product_id) return
      if (seen.has(item.product_id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['items', index, 'product_id'],
          message: 'Producto duplicado',
        })
        return
      }
      seen.add(item.product_id)
    })
  })

export type StockMovementFormValues = z.infer<typeof stockMovementFormSchema>

export const stockMovementFormDefaultValues: StockMovementFormValues = {
  kind: StockMovementKind.reception,
  direction: '',
  moved_at: '',
  notes: '',
  items: [{ product_id: '', quantity: 1 }],
}

type ProductLabel = { id: string; name: string }

type MovementProductFieldProps = {
  index: number
  value: string
  onValueChange: (productId: string) => void
  excludedProductIds: Set<string>
  labelCache: Map<string, ProductLabel>
  onLabelCache: (product: ProductLabel) => void
  disabled?: boolean
  invalid?: boolean
  error?: unknown
}

function MovementProductField({
  index,
  value,
  onValueChange,
  excludedProductIds,
  labelCache,
  onLabelCache,
  disabled = false,
  invalid = false,
  error,
}: MovementProductFieldProps) {
  const [search, setSearch] = useState('')
  const trimmedSearch = search.trim()

  const productsQuery = useListProductsProductsProviderGet(
    {
      page: 1,
      page_size: 20,
      name: trimmedSearch || undefined,
    } as ListProductsProductsProviderGetParams,
    {
      query: {
        enabled: trimmedSearch.length >= 1,
      },
    },
  )

  const items = useMemo(() => {
    const results = productsQuery.data?.items ?? []
    return results.filter(
      (product) =>
        !excludedProductIds.has(product.id) || product.id === value,
    )
  }, [excludedProductIds, productsQuery.data?.items, value])

  const selectedLabel = value ? labelCache.get(value)?.name : undefined

  const handleSearchChange = useCallback((query: string) => {
    setSearch(query)
  }, [])

  const handleItemSelect = useCallback(
    (product: ProductPublic) => {
      onLabelCache({ id: product.id, name: product.name })
    },
    [onLabelCache],
  )

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={`movement-product-${index}`}>Producto</FieldLabel>
      <EntityAutocomplete
        id={`movement-product-${index}`}
        items={items}
        value={value || undefined}
        selectedLabel={selectedLabel}
        onValueChange={onValueChange}
        onItemSelect={handleItemSelect}
        onSearchChange={handleSearchChange}
        isLoading={productsQuery.isFetching}
        placeholder="Buscar producto…"
        minQueryMessage="Escribe para buscar"
        emptyMessage="No se encontraron productos."
        disabled={disabled}
        aria-invalid={invalid}
      />
      {invalid ? <FieldError errors={[error as { message?: string }]} /> : null}
    </Field>
  )
}

export function StockMovementForm({
  ref,
  defaultValues = stockMovementFormDefaultValues,
  onSubmit,
  isSubmitting = false,
  error = null,
}: EntityFormProps<StockMovementFormValues>) {
  const form = useForm<StockMovementFormValues>({
    resolver: zodResolver(stockMovementFormSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  })

  const kind = useWatch({ control: form.control, name: 'kind' })
  const items = useWatch({ control: form.control, name: 'items' })

  const labelCacheRef = useRef(new Map<string, ProductLabel>())
  const [, bumpLabels] = useState(0)

  const onLabelCache = useCallback((product: ProductLabel) => {
    labelCacheRef.current.set(product.id, product)
    bumpLabels((n) => n + 1)
  }, [])

  useFormSubmitHandle(ref, form.handleSubmit, onSubmit)

  return (
    <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
      <FormSection title="Movimiento">
        <FormFieldCell key="kind">
          <Controller
            name="kind"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="movement-kind">Tipo</FieldLabel>
                <EntitySelect
                  id="movement-kind"
                  items={[...STOCK_MOVEMENT_KIND_OPTIONS]}
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                    if (value !== StockMovementKind.correction) {
                      form.setValue('direction', '')
                    }
                  }}
                  placeholder="Seleccionar tipo"
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                  triggerClassName="w-full"
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FormFieldCell>

        {kind === StockMovementKind.correction ? (
          <FormFieldCell key="direction">
            <Controller
              name="direction"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="movement-direction">Dirección</FieldLabel>
                  <EntitySelect
                    id="movement-direction"
                    items={[...STOCK_MOVEMENT_DIRECTION_OPTIONS]}
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    placeholder="Entrada o salida"
                    disabled={isSubmitting}
                    aria-invalid={fieldState.invalid}
                    triggerClassName="w-full"
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />
          </FormFieldCell>
        ) : null}

        <FormFieldCell key="moved_at">
          <Controller
            name="moved_at"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="movement-moved-at">Fecha</FieldLabel>
                <Input
                  {...field}
                  id="movement-moved-at"
                  type="datetime-local"
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FormFieldCell>

        <FormFieldCell key="notes" fullWidth>
          <Controller
            name="notes"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="movement-notes">Notas</FieldLabel>
                <Textarea
                  {...field}
                  id="movement-notes"
                  rows={3}
                  disabled={isSubmitting}
                  aria-invalid={fieldState.invalid}
                  placeholder="Opcional"
                />
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
              </Field>
            )}
          />
        </FormFieldCell>
      </FormSection>

      <FormSection title="Líneas">
        <FormFieldCell key="items" fullWidth>
          <div className="space-y-3">
            {fields.map((field, index) => {
              const excludedProductIds = new Set(
                (items ?? [])
                  .map((item, itemIndex) =>
                    itemIndex === index ? null : item.product_id,
                  )
                  .filter((id): id is string => Boolean(id)),
              )

              return (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-lg border border-border/70 p-3 sm:grid-cols-[1fr_8rem_auto]"
                >
                  <Controller
                    name={`items.${index}.product_id`}
                    control={form.control}
                    render={({ field: itemField, fieldState }) => (
                      <MovementProductField
                        index={index}
                        value={itemField.value}
                        onValueChange={itemField.onChange}
                        excludedProductIds={excludedProductIds}
                        labelCache={labelCacheRef.current}
                        onLabelCache={onLabelCache}
                        disabled={isSubmitting}
                        invalid={fieldState.invalid}
                        error={fieldState.error}
                      />
                    )}
                  />

                  <Controller
                    name={`items.${index}.quantity`}
                    control={form.control}
                    render={({ field: qtyField, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={`movement-qty-${index}`}>
                          Cantidad
                        </FieldLabel>
                        <Input
                          id={`movement-qty-${index}`}
                          type="number"
                          min={1}
                          step={1}
                          value={qtyField.value}
                          onChange={(event) => {
                            const next = Number(event.target.value)
                            qtyField.onChange(
                              Number.isFinite(next) ? next : event.target.value,
                            )
                          }}
                          disabled={isSubmitting}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid ? (
                          <FieldError errors={[fieldState.error]} />
                        ) : null}
                      </Field>
                    )}
                  />

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Quitar línea ${index + 1}`}
                      disabled={isSubmitting || fields.length <= 1}
                      onClick={() => remove(index)}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </div>
              )
            })}

            {form.formState.errors.items?.root?.message ||
            typeof form.formState.errors.items?.message === 'string' ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.items.root?.message ??
                  form.formState.errors.items.message}
              </p>
            ) : null}

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Plus}
              disabled={isSubmitting}
              onClick={() => append({ product_id: '', quantity: 1 })}
            >
              Añadir línea
            </Button>
          </div>
        </FormFieldCell>
      </FormSection>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  )
}
