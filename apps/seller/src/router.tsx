import { RequireAuth } from '@broker/api'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SellerLayout } from './layouts/seller-layout'
import { HomePage } from './pages/home'
import { LoginPage } from './pages/login'
import { RegisterPage } from './pages/register'
import { VerifyEmailPage } from './pages/verify-email'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/register"
          element={
            <RegisterPage
              clientApp="seller"
              description="Crea tu cuenta de vendedor. Te enviaremos un correo para confirmarla."
            />
          }
        />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route
          element={
            <RequireAuth loginPath="/login">
              <SellerLayout />
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
