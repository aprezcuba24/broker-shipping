import { useAuth } from '@broker/api'
import { AppLayout, initialsFromName } from '@broker/ui'
import { useNavigate } from 'react-router-dom'
import { adminBottomItems, adminBrand, adminNavItems } from '../config/navigation'

export function AdminLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    void navigate('/login')
  }

  return (
    <AppLayout
      headerTitle="Administración global"
      navItems={adminNavItems}
      bottomItems={adminBottomItems}
      brand={adminBrand}
      user={
        user
          ? {
              name: user.name,
              role: 'Acceso global',
              initials: initialsFromName(user.name),
            }
          : undefined
      }
      onLogout={handleLogout}
    />
  )
}
