import { AppLayout } from '@broker/ui'
import { useNavigate } from 'react-router-dom'
import {
  adminBottomItems,
  adminBrand,
  adminNavItems,
  adminUser,
} from '../config/navigation'

export function AdminLayout() {
  const navigate = useNavigate()

  return (
    <AppLayout
      headerTitle="Administración global"
      navItems={adminNavItems}
      bottomItems={adminBottomItems}
      brand={adminBrand}
      user={adminUser}
      onLogout={() => navigate('/login')}
    />
  )
}
