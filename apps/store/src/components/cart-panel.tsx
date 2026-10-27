import { formatMoney } from '@broker/ui'

import { PayOnDeliveryNote } from '@/components/pay-on-delivery-note'
import {
  cartTotalsByCurrency,
  useCartStore,
} from '@/stores/cart-store'

type CartPanelProps = {
  open: boolean
  onClose: () => void
  onCheckout: () => void
}

export function CartPanel({ open, onClose, onCheckout }: CartPanelProps) {
  const items = useCartStore((state) => state.items)
  const setQuantity = useCartStore((state) => state.setQuantity)
  const removeBook = useCartStore((state) => state.removeBook)
  const totals = cartTotalsByCurrency(items)
  const totalLabel =
    totals.length > 0
      ? totals.map((money) => formatMoney(money)).join(' + ')
      : formatMoney({ amount: 0, currency: 'usd' })

  return (
    <aside
      className={`store-panel${open ? ' open' : ''}`}
      aria-label="Carrito de compra"
      aria-hidden={!open}
    >
      <div className="store-ph">
        <h2>Tu carrito</h2>
        <button type="button" className="store-btn ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>
      <div className="store-pb">
        {items.length === 0 ? (
          <p className="store-empty">
            Tu carrito está vacío. Agrega un libro para empezar.
          </p>
        ) : (
          items.map((item) => (
            <div key={item.book.id} className="store-line">
              <div>
                <strong>{item.book.name}</strong>
                <br />
                <small style={{ color: 'var(--muted)' }}>
                  {formatMoney(item.book.price)} c/u
                </small>
              </div>
              <strong>
                {formatMoney(
                  item.book.price.amount * item.quantity,
                  item.book.price.currency,
                )}
              </strong>
              <div className="store-qty">
                <button
                  type="button"
                  aria-label="Quitar uno"
                  onClick={() =>
                    setQuantity(item.book.id, item.quantity - 1)
                  }
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  aria-label="Agregar uno"
                  disabled={item.quantity >= item.book.stock}
                  onClick={() =>
                    setQuantity(item.book.id, item.quantity + 1)
                  }
                >
                  +
                </button>
              </div>
              <button
                type="button"
                className="store-rm"
                onClick={() => removeBook(item.book.id)}
              >
                Quitar
              </button>
            </div>
          ))
        )}
      </div>
      <div className="store-pf">
        <div className="store-total">
          <span>Total a pagar al recibir</span>
          <span>{totalLabel}</span>
        </div>
        <PayOnDeliveryNote />
        <button
          type="button"
          className="store-btn wide"
          disabled={items.length === 0}
          style={{ opacity: items.length === 0 ? 0.5 : 1 }}
          onClick={onCheckout}
        >
          Continuar con el pedido
        </button>
      </div>
    </aside>
  )
}
