import { useAuth } from '@broker/api'
import { AppLayout, initialsFromUsername } from '@broker/ui'
import { useNavigate } from 'react-router-dom'
import {
  backofficeBottomItems,
  backofficeBrand,
  backofficeNavItems,
} from '../config/navigation'

export function BackofficeLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    void navigate('/login')
  }

  return (
    <AppLayout
      headerTitle="Portal proveedores"
      navItems={backofficeNavItems}
      bottomItems={backofficeBottomItems}
      brand={backofficeBrand}
      user={
        user
          ? {
              name: user.username,
              role: 'Portal B2B',
              initials: initialsFromUsername(user.username),
            }
          : undefined
      }
      onLogout={handleLogout}
    />
  )
}
