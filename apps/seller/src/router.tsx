import { RequireAuth } from '@broker/api'
import {
  ActiveOrganizationProvider,
  OrganizationScopedApiProvider,
} from '@broker/ui'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SellerLayout } from './layouts/seller-layout'
import { HomePage } from './pages/home'
import { LoginPage } from './pages/login'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth loginPath="/login">
              <ActiveOrganizationProvider tenantQueryKeys={[]}>
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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
