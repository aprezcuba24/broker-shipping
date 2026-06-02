import {
  RequireAuth,
  getListCategoriesProductsCategoriesGetQueryKey,
  getListProductsProductsGetQueryKey,
} from '@broker/api'
import {
  ActiveOrganizationProvider,
  OrganizationScopedApiProvider,
} from '@broker/ui'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { BackofficeLayout } from './layouts/backoffice-layout'
import { LoginPage } from './pages/login'
import { CategoryPage } from './pages/category'
import { OrganizationPage } from './pages/organization'
import { ProductPage } from './pages/product'

const tenantQueryKeys = [
  getListCategoriesProductsCategoriesGetQueryKey(),
  getListProductsProductsGetQueryKey(),
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
                  <BackofficeLayout />
                </OrganizationScopedApiProvider>
              </ActiveOrganizationProvider>
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/products" replace />} />
          <Route path="/products" element={<ProductPage />} />
          <Route path="/categories" element={<CategoryPage />} />
          <Route path="/organizations" element={<OrganizationPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
