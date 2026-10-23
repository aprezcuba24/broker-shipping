import { Button, formatMoney } from '@broker/ui'
import { Link } from 'react-router-dom'

import { BookCover } from '@/components/book-cover'
import { PayOnDeliveryNote } from '@/components/pay-on-delivery-note'
import { SaleFlow } from '@/components/sale-flow'
import {
  cartTotalsByCurrency,
  useCartStore,
} from '@/stores/cart-store'

export function CartPage() {
  const items = useCartStore((state) => state.items)
  const setQuantity = useCartStore((state) => state.setQuantity)
  const removeBook = useCartStore((state) => state.removeBook)
  const totals = cartTotalsByCurrency(items)

  if (items.length === 0) {
    return (
      <div className="space-y-6 py-10 text-center">
        <h2 className="font-display text-2xl font-semibold text-[color:var(--spine)]">
          Tu carrito está vacío
        </h2>
        <p className="text-[color:var(--ink-muted)]">
          Elige un libro del estante para empezar.
        </p>
        <Button asChild>
          <Link to="/">Ir al estante</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-semibold text-[color:var(--spine)]">
          Carrito
        </h2>
        <p className="mt-1 text-[color:var(--ink-muted)]">
          Revisa tu pedido antes de registrar tus datos.
        </p>
      </div>

      <PayOnDeliveryNote />

      <ul className="space-y-4">
        {items.map((item) => (
          <li
            key={item.book.id}
            className="flex gap-4 rounded-md border border-[color:var(--border)] bg-white/70 p-3 sm:p-4"
          >
            <Link
              to={`/libros/${item.book.id}`}
              className="w-20 shrink-0 overflow-hidden rounded-sm shadow ring-1 ring-[color:var(--border)] sm:w-24"
            >
              <BookCover title={item.book.name} imageUrl={item.book.image_url} />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div>
                <Link
                  to={`/libros/${item.book.id}`}
                  className="font-display text-lg font-semibold text-[color:var(--ink)] hover:text-[color:var(--spine)]"
                >
                  {item.book.name}
                </Link>
                <p className="text-sm text-[color:var(--ink-muted)]">
                  {formatMoney(item.book.price)} · stock {item.book.stock}
                </p>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  Cantidad
                  <input
                    type="number"
                    min={1}
                    max={item.book.stock}
                    value={item.quantity}
                    className="h-9 w-16 rounded-md border border-input bg-background px-2"
                    onChange={(event) =>
                      setQuantity(item.book.id, Number(event.target.value) || 0)
                    }
                  />
                </label>
                <button
                  type="button"
                  className="text-sm text-[color:var(--spine)] underline-offset-2 hover:underline"
                  onClick={() => removeBook(item.book.id)}
                >
                  Quitar
                </button>
                <p className="ml-auto font-display text-base text-[color:var(--spine)]">
                  {formatMoney(
                    item.book.price.amount * item.quantity,
                    item.book.price.currency,
                  )}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-4 rounded-md border border-[color:var(--border)] bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[color:var(--ink-muted)]">Total</p>
          <p className="font-display text-2xl text-[color:var(--spine)]">
            {totals.map((money) => formatMoney(money)).join(' + ')}
          </p>
        </div>
        <Button asChild size="lg">
          <Link to="/pedido">Continuar al pedido</Link>
        </Button>
      </div>

      <SaleFlow compact />
    </div>
  )
}
