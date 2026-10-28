import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { useGetStorefrontStorefrontGet } from '@broker/api'
import { WhatsAppChatButton } from '@broker/ui'

import { CartPanel } from '@/components/cart-panel'
import { CheckoutPanel, DonePanel } from '@/components/checkout-panel'
import { StoreToastProvider } from '@/components/store-toast'
import { SELLER_ORGANIZATION_ID, WHATSAPP_PHONE } from '@/config/env'
import type { CompletedCheckout } from '@/lib/checkout'
import { cartItemCount, useCartStore } from '@/stores/cart-store'

type Panel = 'cart' | 'checkout' | 'done' | null

function panelForRoute(
  pathname: string,
  itemCount: number,
  completed: CompletedCheckout | null,
): Panel {
  if (completed) return 'done'
  if (pathname === '/carrito') return 'cart'
  if (pathname === '/pedido') return itemCount > 0 ? 'checkout' : 'cart'
  return null
}

export function StoreLayout() {
  const items = useCartStore((state) => state.items)
  const count = cartItemCount(items)
  const storeQuery = useGetStorefrontStorefrontGet({
    organization_id: SELLER_ORGANIZATION_ID,
  })
  const storeName = storeQuery.data?.name ?? 'Librería'
  const location = useLocation()
  const navigate = useNavigate()
  const [completed, setCompleted] = useState<CompletedCheckout | null>(null)
  const panel = panelForRoute(location.pathname, items.length, completed)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setCompleted(null)
      if (
        location.pathname === '/carrito' ||
        location.pathname === '/pedido'
      ) {
        navigate('/', { replace: true })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [location.pathname, navigate])

  function closePanel() {
    setCompleted(null)
    if (
      location.pathname === '/carrito' ||
      location.pathname === '/pedido'
    ) {
      navigate('/', { replace: true })
    }
  }

  function openCart() {
    setCompleted(null)
    if (location.pathname !== '/carrito') {
      navigate('/carrito')
    }
  }

  function openCheckout() {
    if (items.length === 0) return
    setCompleted(null)
    if (location.pathname !== '/pedido') {
      navigate('/pedido')
    }
  }

  function handleCompleted(payload: CompletedCheckout) {
    setCompleted(payload)
  }

  return (
    <StoreToastProvider>
      <div className="store-strip">
        Pagas cuando recibes tu libro. No pedimos tarjeta ni pago en línea.
      </div>
      <header className="store-header">
        <div className="store-wrap store-bar">
          <Link
            to="/"
            className="store-logo"
            onClick={() => setCompleted(null)}
          >
            {storeName}
          </Link>
          <button
            type="button"
            className="store-cartbtn"
            aria-label="Abrir carrito"
            onClick={openCart}
          >
            Carrito <b>{count}</b>
          </button>
        </div>
      </header>

      <main className="store-wrap">
        <Outlet />
      </main>

      <footer className="store-footer">
        <div className="store-wrap">
          {storeName} · Pago contra entrega · Atención por WhatsApp
        </div>
      </footer>

      <div
        className={`store-scrim${panel ? ' open' : ''}`}
        onClick={closePanel}
        aria-hidden
      />

      <CartPanel
        open={panel === 'cart'}
        onClose={closePanel}
        onCheckout={openCheckout}
      />
      <CheckoutPanel
        open={panel === 'checkout'}
        onClose={closePanel}
        onBackToCart={openCart}
        onCompleted={handleCompleted}
      />
      {completed ? (
        <DonePanel
          open={panel === 'done'}
          onClose={closePanel}
          completed={completed}
        />
      ) : null}

      <WhatsAppChatButton
        phone={WHATSAPP_PHONE}
        text="Si tienes alguna sugerencia o quieres vender esos libros que tienes en la casa contacta al desarrollador."
      />
    </StoreToastProvider>
  )
}
