import { RequireAuth } from '@broker/api'
import {
  ActiveOrganizationProvider,
  OrganizationScopedApiProvider,
} from '@broker/ui'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SellerLayout } from './layouts/seller-layout'
import { CartPage } from './pages/cart'
import { CartCheckoutPage } from './pages/cart/checkout'
import { HomePage } from './pages/home'
import { LoginPage } from './pages/login'
import { OrderDetailPage } from './pages/order/detail'
import { ProductPage } from './pages/product'
import { ProductDetailPage } from './pages/product/detail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth loginPath="/login">
              <ActiveOrganizationProvider>
                <OrganizationScopedApiProvider
                  baseUrl={import.meta.env.VITE_API_URL}
                >
                  <SellerLayout />
                </OrganizationScopedApiProvider>
              </ActiveOrganizationProvider>
            </RequireAuth>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="/products" element={<ProductPage />} />
          <Route path="/products/:productId" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/cart/checkout" element={<CartCheckoutPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
