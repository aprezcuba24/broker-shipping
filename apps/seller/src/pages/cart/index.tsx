import {
  BtnConfirm,
  BtnLink,
  DataTable,
  PageWrapper,
} from '@broker/ui'
import { Package, ShoppingCart } from 'lucide-react'
import { useMemo } from 'react'

import { useCart } from '@/hooks/use-cart'
import { useCartPreview } from '@/hooks/use-cart-preview'
import { useLinkedProviders } from '@/hooks/use-linked-providers'

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
  const totals = useMemo(
    () => computeCartTotals(items, previewByProductId),
    [items, previewByProductId],
  )
  const hasItems = items.length > 0

  const columns = useMemo(
    () => buildCartColumns({ getProviderName }),
    [getProviderName],
  )

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
    </PageWrapper>
  )
}
