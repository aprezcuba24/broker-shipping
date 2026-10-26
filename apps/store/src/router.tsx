import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { StoreLayout } from '@/components/store-layout'
import { isStoreConfigured } from '@/config/env'
import { BookDetailPage } from '@/pages/book-detail-page'
import { CartPage } from '@/pages/cart-page'
import { CheckoutPage } from '@/pages/checkout-page'
import { HomePage } from '@/pages/home-page'

function MissingConfigPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-[color:var(--ink)]">
        Tienda sin configurar
      </h1>
      <div className="gilt-rule mx-auto max-w-[10rem]" aria-hidden />
      <p className="text-[color:var(--ink-muted)] leading-relaxed">
        Define{' '}
        <code className="rounded bg-[color:var(--paper-raised)] px-1.5 py-0.5 text-sm">
          VITE_SELLER_ORGANIZATION_ID
        </code>{' '}
        y{' '}
        <code className="rounded bg-[color:var(--paper-raised)] px-1.5 py-0.5 text-sm">
          VITE_WHATSAPP_PHONE
        </code>{' '}
        en el entorno de esta app.
      </p>
    </div>
  )
}

export default function App() {
  if (!isStoreConfigured()) {
    return <MissingConfigPage />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<StoreLayout />}>
          <Route index element={<HomePage />} />
          <Route path="libros/:productId" element={<BookDetailPage />} />
          <Route path="carrito" element={<CartPage />} />
          <Route path="pedido" element={<CheckoutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
