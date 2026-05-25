import { RequireAuth } from '@broker/api'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { BackofficeLayout } from './layouts/backoffice-layout'
import { LoginPage } from './pages/login'
import { ProductListPage } from './pages/product/list'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth loginPath="/login">
              <BackofficeLayout />
            </RequireAuth>
          }
        >
          <Route path="/products" element={<ProductListPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
