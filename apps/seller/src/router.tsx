import { OrganizationType, RequireAuth } from '@broker/api'
import {
  ActiveOrganizationProvider,
  OrganizationScopedApiProvider,
  RequireOrganization,
} from '@broker/ui'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SellerLayout } from './layouts/seller-layout'
import { AcceptInvitationPage } from './pages/accept-invitation'
import { HomePage } from './pages/home'
import { LoginPage } from './pages/login'
import { OnboardingPage } from './pages/onboarding'
import { CartPage } from './pages/cart'
import { OrderDetailPage, OrderPage } from './pages/order'
import { ProductDetailPage, ProductPage } from './pages/product'
import { ProviderLinkRequestPage } from './pages/providers/link-request'
import { RegisterPage } from './pages/register'
import { InvitationsSettingsPage } from './pages/settings/invitations'
import { OrganizationsSettingsPage } from './pages/settings/organizations'
import { VerifyEmailPage } from './pages/verify-email'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/register"
          element={
            <RegisterPage description="Crea tu cuenta de vendedor. Te enviaremos un correo para confirmarla." />
          }
        />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
        <Route
          path="/onboarding"
          element={
            <RequireAuth loginPath="/login">
              <ActiveOrganizationProvider organizationType={OrganizationType.seller}>
                <OnboardingPage
                  title="Configura tu organización"
                  description="Como vendedor, crea la organización con la que trabajarás en Broker."
                />
              </ActiveOrganizationProvider>
            </RequireAuth>
          }
        />
        <Route
          element={
            <RequireAuth loginPath="/login">
              <ActiveOrganizationProvider organizationType={OrganizationType.seller}>
                <RequireOrganization>
                  <OrganizationScopedApiProvider baseUrl={import.meta.env.VITE_API_URL}>
                    <SellerLayout />
                  </OrganizationScopedApiProvider>
                </RequireOrganization>
              </ActiveOrganizationProvider>
            </RequireAuth>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductPage />} />
          <Route path="products/:productId" element={<ProductDetailPage />} />
          <Route path="orders" element={<OrderPage />} />
          <Route path="orders/:orderId" element={<OrderDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="settings/organizations" element={<OrganizationsSettingsPage />} />
          <Route path="settings/invitations" element={<InvitationsSettingsPage />} />
          <Route path="providers/link-request" element={<ProviderLinkRequestPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
