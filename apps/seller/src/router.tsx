import {
  RequireAuth,
  getListProductsProductsSellerGetQueryKey,
  getListProvidersOrganizationsSellerProvidersGetQueryKey,
} from '@broker/api'
import {
  ActiveOrganizationProvider,
  OrganizationScopedApiProvider,
} from '@broker/ui'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SellerLayout } from './layouts/seller-layout'
import { HomePage } from './pages/home'
import { LoginPage } from './pages/login'
import { ProductPage } from './pages/product'
import { ProductDetailPage } from './pages/product/detail'

const tenantQueryKeys = [
  getListProductsProductsSellerGetQueryKey(),
  getListProvidersOrganizationsSellerProvidersGetQueryKey(),
]

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth loginPath="/login">
              <ActiveOrganizationProvider tenantQueryKeys={tenantQueryKeys}>
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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
