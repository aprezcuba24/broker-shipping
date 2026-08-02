import {
  BtnConfirm,
  BtnLink,
  Button,
  DataTable,
  EntityFormDialog,
  PageWrapper,
} from '@broker/ui'
import { Package, ShoppingCart } from 'lucide-react'
import { useMemo, useState } from 'react'

import { useCart } from '@/hooks/use-cart'
import { useCartPreview } from '@/hooks/use-cart-preview'
import { useRegisterOrder } from '@/hooks/use-register-order'
import { useLinkedProviders } from '@/hooks/use-linked-providers'
import {
  CustomerForm,
  customerFormDefaultValues,
  type CustomerFormValues,
} from '@/pages/customer/form'

import { CartOrderTotals } from './cart-order-totals'
import { CartPreviewProvider } from './cart-preview-context'
import { computeCartTotals } from './cart-utils'
import { buildCartColumns } from './columns'

export function CartPage() {
  const { items, totalItems, clearCart } = useCart()
  const { getProviderName } = useLinkedProviders()
  const {
    order,
    previewByProductId,
    isInitialLoading,
    isRefreshing,
    isError,
  } = useCartPreview()
  const { registerOrder, isSubmitting, error, setError } =
    useRegisterOrder(previewByProductId)

  const [registerOpen, setRegisterOpen] = useState(false)

  const totals = useMemo(
    () => computeCartTotals(items, previewByProductId),
    [items, previewByProductId],
  )
  const hasItems = items.length > 0
  const canRegister =
    hasItems && Boolean(order) && !isError && !isInitialLoading && !isSubmitting

  const columns = useMemo(
    () => buildCartColumns({ getProviderName }),
    [getProviderName],
  )

  const handleRegisterSubmit = async (values: CustomerFormValues) => {
    await registerOrder(values)
  }

  return (
    <PageWrapper
      title="Carrito"
      description={
        hasItems
          ? `${totalItems} unidad${totalItems === 1 ? '' : 'es'} en el carrito.`
          : 'Productos seleccionados para crear una orden.'
      }
      icon={ShoppingCart}
      buttons={
        hasItems
          ? [
              <BtnConfirm
                key="clear"
                variant="outline"
                size="sm"
                label="Vaciar carrito"
                title="Vaciar carrito"
                description="Se eliminarán todos los productos del carrito. Esta acción no se puede deshacer."
                confirmLabel="Vaciar"
                confirmVariant="destructive"
                onConfirm={clearCart}
              />,
              <Button
                key="register"
                size="sm"
                disabled={!canRegister}
                onClick={() => {
                  setError(null)
                  setRegisterOpen(true)
                }}
              >
                Registrar
              </Button>,
            ]
          : null
      }
      empty={
        hasItems
          ? null
          : {
              message:
                'No hay productos en el carrito. Explora el catálogo y añade los que necesites.',
              action: (
                <BtnLink to="/products" variant="outline" icon={Package}>
                  Ver productos
                </BtnLink>
              ),
            }
      }
    >
      <div className="space-y-4">
        <CartPreviewProvider previewByProductId={previewByProductId}>
          <DataTable
            columns={columns}
            data={items}
            getRowId={(row) => row.product.id}
            pagination={{
              page: 1,
              total: items.length,
              onPageChange: () => {},
            }}
          />
        </CartPreviewProvider>
        <CartOrderTotals
          totals={totals}
          isInitialLoading={isInitialLoading}
          isRefreshing={isRefreshing}
          isError={isError}
          hasOrder={Boolean(order)}
        />
      </div>

      <EntityFormDialog<CustomerFormValues>
        Form={CustomerForm}
        title="Registrar cliente"
        acceptLabel="Crear orden"
        open={registerOpen}
        onOpenChange={(open) => {
          setRegisterOpen(open)
          if (!open) setError(null)
        }}
        defaultValues={customerFormDefaultValues}
        onSubmit={handleRegisterSubmit}
        isSubmitting={isSubmitting}
        error={error}
        formKey="register-customer"
      />
    </PageWrapper>
  )
}
