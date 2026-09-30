import {
  getGetProductProductsSellerProductIdGetQueryKey,
  getListProductsProductsSellerGetQueryKey,
  useUpdateSellerProductProductsSellerProductIdPatch,
  type GetProductProductsSellerProductIdGetParams,
  type Money,
  type ProductPublic,
  type UpdateSellerProductProductsSellerProductIdPatchParams,
} from '@broker/api'
import { useEffect, useState } from 'react'

import { Button } from '../components/button'
import { FormFieldCell, FormSection } from '../components/form-section'
import { MoneyField } from '../components/money-field'
import { Field, FieldError, FieldLabel } from '../components/ui/field'
import { useAsyncAction } from '../crud/hooks/use-async-action'
import { useQueryCacheSync } from '../crud/hooks/use-query-cache-sync'
import { formatMoney } from '../lib/utils'

export type SellerSalePriceSectionProps = {
  product: ProductPublic
}

export function SellerSalePriceSection({ product }: SellerSalePriceSectionProps) {
  const detailParams = {} as GetProductProductsSellerProductIdGetParams
  const detailQueryKey = getGetProductProductsSellerProductIdGetQueryKey(
    product.id,
    detailParams,
  )
  const { sync } = useQueryCacheSync({
    detailQueryKey,
    invalidateKeys: [
      getListProductsProductsSellerGetQueryKey(),
      detailQueryKey,
    ],
  })

  const mutation = useUpdateSellerProductProductsSellerProductIdPatch()

  const [draft, setDraft] = useState<Money>(
    () => product.sale_price ?? { ...product.price },
  )

  useEffect(() => {
    setDraft(product.sale_price ?? { ...product.price })
  }, [product.id, product.sale_price, product.price])

  const save = useAsyncAction(
    async () => {
      const result = await mutation.mutateAsync({
        productId: product.id,
        data: { sale_price: draft },
        params: {} as UpdateSellerProductProductsSellerProductIdPatchParams,
      })
      await sync(result)
      return result
    },
    undefined,
    undefined,
    { success: 'Precio de venta actualizado' },
  )

  const clear = useAsyncAction(
    async () => {
      const result = await mutation.mutateAsync({
        productId: product.id,
        data: { sale_price: null },
        params: {} as UpdateSellerProductProductsSellerProductIdPatchParams,
      })
      await sync(result)
      return result
    },
    undefined,
    undefined,
    { success: 'Precio de venta restablecido' },
  )

  const isPending = save.isPending || clear.isPending
  const error = save.error ?? clear.error
  const hasCustomPrice = product.sale_price != null

  return (
    <FormSection title="Tu precio de venta">
      <FormFieldCell fullWidth>
        <p className="text-sm text-muted-foreground">
          Precio del proveedor:{' '}
          <span className="font-medium tabular-nums text-on-surface">
            {formatMoney(product.price)}
          </span>
          . Si defines un precio propio, las órdenes usarán ese valor y la
          diferencia se sumará a la comisión.
        </p>
      </FormFieldCell>
      <FormFieldCell fullWidth>
        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="seller-sale-price">Precio de venta</FieldLabel>
          <MoneyField
            id="seller-sale-price"
            value={draft}
            onValueChange={(value) =>
              setDraft({ ...value, currency: product.price.currency })
            }
            disabled={isPending}
            aria-invalid={Boolean(error)}
          />
          {error ? <FieldError>{error}</FieldError> : null}
        </Field>
      </FormFieldCell>
      <FormFieldCell fullWidth>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            isLoading={save.isPending}
            onClick={() => {
              void save.run()
            }}
          >
            Guardar precio
          </Button>
          {hasCustomPrice ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              isLoading={clear.isPending}
              onClick={() => {
                void clear.run()
              }}
            >
              Usar precio del proveedor
            </Button>
          ) : null}
        </div>
      </FormFieldCell>
    </FormSection>
  )
}
