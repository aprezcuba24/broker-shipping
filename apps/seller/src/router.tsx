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
import { JoinProviderPage } from './pages/join-provider'
import { LoginPage } from './pages/login'
import { OnboardingPage } from './pages/onboarding'
import { CartPage } from './pages/cart'
import { CommissionDetailPage, CommissionPage } from './pages/commission'
import { OrderDetailPage, OrderPage } from './pages/order'
import { ProductDetailPage, ProductPage } from './pages/product'
import { MembersPage } from './pages/members'
import { ProvidersPage } from './pages/providers'
import { RegisterPage } from './pages/register'
import { VerifyEmailPage } from './pages/verify-email'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
        <Route
          path="/join-provider"
          element={
            <ActiveOrganizationProvider organizationType={OrganizationType.seller}>
              <JoinProviderPage />
            </ActiveOrganizationProvider>
          }
        />
        <Route
          path="/onboarding"
          element={
            <RequireAuth loginPath="/login">
              <ActiveOrganizationProvider organizationType={OrganizationType.seller}>
                <OnboardingPage title="Configura tu organización" />
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
          <Route path="commissions" element={<CommissionPage />} />
          <Route path="commissions/:commissionId" element={<CommissionDetailPage />} />
          <Route path="providers" element={<ProvidersPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="settings/invitations" element={<Navigate to="/members" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
