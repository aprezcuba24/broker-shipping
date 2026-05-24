import { RequireAuth } from '@broker/api'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './layouts/admin-layout'
import { LoginPage } from './pages/login'
import { OrganizationListPage } from './pages/organization/list'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth loginPath="/login">
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route path="/organizations" element={<OrganizationListPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
