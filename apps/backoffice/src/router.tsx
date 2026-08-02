import { OrganizationType, RequireAuth } from '@broker/api'
import {
  ActiveOrganizationProvider,
  OrganizationScopedApiProvider,
  RequireOrganization,
} from '@broker/ui'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { BackofficeLayout } from './layouts/backoffice-layout'
import { AcceptInvitationPage } from './pages/accept-invitation'
import { HomePage } from './pages/home'
import { LoginPage } from './pages/login'
import { OnboardingPage } from './pages/onboarding'
import { RegisterPage } from './pages/register'
import { MembersPage } from './pages/members'
import { OrderDetailPage, OrderPage } from './pages/order'
import { InvitationsSettingsPage } from './pages/settings/invitations'
import { OrganizationsSettingsPage } from './pages/settings/organizations'
import {
  ProductCreatePage,
  ProductEditPage,
  ProductPage,
} from './pages/product'
import { TagPage } from './pages/tag'
import { VerifyEmailPage } from './pages/verify-email'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/register"
          element={
            <RegisterPage description="Crea tu cuenta de proveedor. Te enviaremos un correo para confirmarla." />
          }
        />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
        <Route
          path="/onboarding"
          element={
            <RequireAuth loginPath="/login">
              <ActiveOrganizationProvider organizationType={OrganizationType.provider}>
                <OnboardingPage
                  title="Configura tu organización"
                  description="Como proveedor, crea la organización con la que trabajarás en Broker."
                />
              </ActiveOrganizationProvider>
            </RequireAuth>
          }
        />
        <Route
          element={
            <RequireAuth loginPath="/login">
              <ActiveOrganizationProvider organizationType={OrganizationType.provider}>
                <RequireOrganization>
                  <OrganizationScopedApiProvider baseUrl={import.meta.env.VITE_API_URL}>
                    <BackofficeLayout />
                  </OrganizationScopedApiProvider>
                </RequireOrganization>
              </ActiveOrganizationProvider>
            </RequireAuth>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="orders" element={<OrderPage />} />
          <Route path="orders/:orderId" element={<OrderDetailPage />} />
          <Route path="products" element={<ProductPage />} />
          <Route path="products/new" element={<ProductCreatePage />} />
          <Route path="products/:productId" element={<ProductEditPage />} />
          <Route path="tags" element={<TagPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="settings/organizations" element={<OrganizationsSettingsPage />} />
          <Route path="settings/invitations" element={<InvitationsSettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
