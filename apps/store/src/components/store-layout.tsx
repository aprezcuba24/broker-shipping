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
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-12 pt-6 sm:px-6">
      <header className="mb-10">
        <div className="flex items-start justify-between gap-4">
          <Link to="/" className="min-w-0 group">
            <h1 className="font-display truncate text-[1.65rem] font-semibold leading-tight tracking-tight text-[color:var(--ink)] transition-colors group-hover:text-[color:var(--spine)] sm:text-3xl">
              {storeName}
            </h1>
            <p className="mt-1.5 text-sm text-[color:var(--ink-muted)]">
              Entrega a domicilio · pagas al recibir
            </p>
          </Link>
          <Link
            to="/carrito"
            className="relative mt-0.5 inline-flex items-center gap-2 rounded-full border border-[color:var(--ink)]/10 bg-[color:var(--paper-raised)] px-3.5 py-2 text-sm text-[color:var(--ink-secondary)] shadow-[var(--shadow-soft)] transition hover:border-[color:var(--spine)]/25 hover:text-[color:var(--spine)]"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Carrito</span>
            {count > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--spine)] px-1 text-[0.65rem] font-semibold text-[color:var(--paper-raised)]">
                {count}
              </span>
            ) : null}
          </Link>
        </div>
        <div className="gilt-rule mt-6" aria-hidden />
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="mt-16">
        <div className="gilt-rule mb-5" aria-hidden />
        <p className="text-center text-sm text-[color:var(--ink-muted)]">
          Libros de uso · el vendedor te los lleva a casa
        </p>
      </footer>
    </div>
  )
}
