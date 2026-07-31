import {
  BtnConfirm,
  BtnLink,
  PageWrapper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@broker/ui'
import { Package, ShoppingCart } from 'lucide-react'

import { ProductCartControl } from '@/components/product-cart-control'
import { useCart } from '@/hooks/use-cart'
import { useLinkedProviders } from '@/hooks/use-linked-providers'

export function CartPage() {
  const { items, totalItems, clearCart } = useCart()
  const { getProviderName } = useLinkedProviders()

  return (
    <PageWrapper
      title="Carrito"
      description={
        totalItems > 0
          ? `${totalItems} unidad${totalItems === 1 ? '' : 'es'} en el carrito.`
          : 'Productos seleccionados para crear una orden.'
      }
      icon={ShoppingCart}
    >
      {items.length === 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            No hay productos en el carrito. Explora el catálogo y añade los que necesites.
          </p>
          <BtnLink to="/products" variant="outline" icon={Package}>
            Ver productos
          </BtnLink>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <BtnConfirm
              variant="outline"
              size="sm"
              label="Vaciar carrito"
              title="Vaciar carrito"
              description="Se eliminarán todos los productos del carrito. Esta acción no se puede deshacer."
              confirmLabel="Vaciar"
              confirmVariant="destructive"
              onConfirm={clearCart}
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.product.id}>
                    <TableCell className="font-medium">{item.product.name}</TableCell>
                    <TableCell>
                      {getProviderName(item.product.organization_id)}
                    </TableCell>
                    <TableCell>
                      <ProductCartControl product={item.product} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </PageWrapper>
  )
}
