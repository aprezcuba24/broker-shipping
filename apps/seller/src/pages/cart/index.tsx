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
import { buildCartColumns } from './columns'

export function CartPage() {
  const { items, totalItems, clearCart } = useCart()
  const { getProviderName } = useLinkedProviders()
  const { order, previewByProductId, isLoading, isError } = useCartPreview()
  const totals = order?.totals ?? []
  const hasItems = items.length > 0

  const columns = useMemo(
    () => buildCartColumns({ getProviderName, previewByProductId }),
    [getProviderName, previewByProductId],
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
        <CartOrderTotals
          totals={totals}
          isLoading={isLoading}
          isError={isError}
          hasOrder={Boolean(order)}
        />
      </div>
    </PageWrapper>
  )
}
