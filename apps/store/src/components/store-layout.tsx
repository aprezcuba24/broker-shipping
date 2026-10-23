import { ShoppingBag } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'

import { useGetStorefrontStorefrontGet } from '@broker/api'

import { SELLER_ORGANIZATION_ID } from '@/config/env'
import { cartItemCount, useCartStore } from '@/stores/cart-store'

export function StoreLayout() {
  const items = useCartStore((state) => state.items)
  const count = cartItemCount(items)
  const storeQuery = useGetStorefrontStorefrontGet({
    organization_id: SELLER_ORGANIZATION_ID,
  })
  const storeName = storeQuery.data?.name ?? 'Librería'

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6">
      <header className="mb-8 flex items-center justify-between gap-4 border-b border-[color:var(--gilt)]/35 pb-4">
        <Link to="/" className="min-w-0">
          <p className="text-[0.7rem] uppercase tracking-[0.22em] text-[color:var(--gilt)]">
            Libros de uso
          </p>
          <h1 className="font-display truncate text-2xl font-semibold text-[color:var(--spine)] sm:text-3xl">
            {storeName}
          </h1>
        </Link>
        <Link
          to="/carrito"
          className="relative inline-flex items-center gap-2 rounded-full border border-[color:var(--spine)]/25 bg-white/70 px-3 py-2 text-sm font-medium text-[color:var(--spine)] transition hover:bg-white"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Carrito</span>
          {count > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--spine)] px-1 text-[0.7rem] font-semibold text-[color:var(--paper)]">
              {count}
            </span>
          ) : null}
        </Link>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="mt-12 border-t border-[color:var(--gilt)]/30 pt-4 text-center text-xs text-[color:var(--ink-muted)]">
        Entrega a domicilio · Pago al recibir
      </footer>
    </div>
  )
}
