import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { StoreLayout } from '@/components/store-layout'
import { isStoreConfigured } from '@/config/env'
import { BookDetailPage } from '@/pages/book-detail-page'
import { CartPage } from '@/pages/cart-page'
import { CheckoutPage } from '@/pages/checkout-page'
import { HomePage } from '@/pages/home-page'

function MissingConfigPage() {
  return (
    <div
      className="store-wrap"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '1rem',
        textAlign: 'center',
        maxWidth: '32rem',
      }}
    >
      <h1
        style={{
          font: '700 1.8rem var(--serif)',
          margin: 0,
          color: 'var(--ink)',
        }}
      >
        Tienda sin configurar
      </h1>
      <p style={{ color: 'var(--muted)', margin: 0, lineHeight: 1.55 }}>
        Define{' '}
        <code
          style={{
            borderRadius: 8,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            padding: '0.15rem 0.45rem',
            fontSize: '0.9rem',
          }}
        >
          VITE_SELLER_ORGANIZATION_ID
        </code>{' '}
        y{' '}
        <code
          style={{
            borderRadius: 8,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            padding: '0.15rem 0.45rem',
            fontSize: '0.9rem',
          }}
        >
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
