import { Button, formatPriceCents, PageWrapper } from '@broker/ui'
import { ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCartStore } from '@/stores/cart-store'
import { CartLines } from './cart-lines'

export function CartPage() {
  const lines = useCartStore((state) => state.lines)
  const total = useCartStore((state) =>
    state.lines.reduce((sum, line) => sum + line.line_total, 0),
  )

  return (
    <PageWrapper title="Carrito" icon={ShoppingCart}>
      {lines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Tu carrito está vacío.
          </p>
          <Button variant="link" asChild className="mt-2">
            <Link to="/products">Ir al catálogo</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <CartLines lines={lines} />

          <section className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Total a pagar
              </span>
              <span className="text-lg font-semibold tabular-nums">
                {formatPriceCents(total)}
              </span>
            </div>
          </section>

          <Button asChild className="w-full sm:w-auto">
            <Link to="/cart/checkout">Crear orden al cliente</Link>
          </Button>
        </div>
      )}
    </PageWrapper>
  )
}
