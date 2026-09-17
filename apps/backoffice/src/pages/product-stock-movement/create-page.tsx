import {
  getListMovementsProductStockMovementsProviderGetQueryKey,
  getListProductsProductsProviderGetQueryKey,
  StockMovementKind,
  useCreateMovementProductStockMovementsProviderPost,
  type CreateMovementProductStockMovementsProviderPostParams,
  type ProductStockMovementCreate,
  type ProductStockMovementPublic,
} from '@broker/api'
import { EntityFormPage, useEntityFormMutation } from '@broker/ui'
import { Boxes } from 'lucide-react'

import {
  StockMovementForm,
  stockMovementFormDefaultValues,
  type StockMovementFormValues,
} from './form'

function toCreatePayload(
  values: StockMovementFormValues,
): ProductStockMovementCreate {
  const payload: ProductStockMovementCreate = {
    kind: values.kind,
    notes: values.notes?.trim() ? values.notes.trim() : null,
    items: values.items.map((item) => ({
      product_id: item.product_id,
      quantity: Number(item.quantity),
    })),
  }

  if (values.moved_at?.trim()) {
    payload.moved_at = new Date(values.moved_at).toISOString()
  } else {
    payload.moved_at = null
  }

  if (values.kind === StockMovementKind.correction && values.direction) {
    payload.direction = values.direction
  }

  return payload
}

export function StockMovementCreatePage() {
  const createMutation = useCreateMovementProductStockMovementsProviderPost()

  const create = useEntityFormMutation({
    mutate: async (
      values: StockMovementFormValues,
    ): Promise<ProductStockMovementPublic> =>
      createMutation.mutateAsync({
        data: toCreatePayload(values),
        params: {} as CreateMovementProductStockMovementsProviderPostParams,
      }),
    invalidateKeys: [
      getListMovementsProductStockMovementsProviderGetQueryKey(),
      getListProductsProductsProviderGetQueryKey(),
    ],
    redirectTo: '/inventory',
    entityLabel: 'Movimiento',
    mode: 'create',
  })

  return (
    <EntityFormPage
      title="Nuevo movimiento"
      description="Registra una recepción, merma o corrección de inventario."
      icon={Boxes}
      Form={StockMovementForm}
      defaultValues={stockMovementFormDefaultValues}
      formKey="create"
      onSubmit={create.run}
      isSubmitting={create.isPending}
      error={create.error}
      submitLabel="Crear"
      backTo="/inventory"
    />
  )
}
