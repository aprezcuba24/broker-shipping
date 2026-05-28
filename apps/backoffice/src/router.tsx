import { RequireAuth } from '@broker/api'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ActiveOrganizationProvider } from './contexts/active-organization-context'
import { AuthProvider } from './contexts/auth-context'
import { BackofficeLayout } from './layouts/backoffice-layout'
import { LoginPage } from './pages/login'
import { CategoryPage } from './pages/category'
import { OrganizationPage } from './pages/organization'
import { ProductListPage } from './pages/product/list'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth loginPath="/login">
              <ActiveOrganizationProvider>
                <AuthProvider>
                  <BackofficeLayout />
                </AuthProvider>
              </ActiveOrganizationProvider>
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/products" replace />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/categories" element={<CategoryPage />} />
          <Route path="/organizations" element={<OrganizationPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/products" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
