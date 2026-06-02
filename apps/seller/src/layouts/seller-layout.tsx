import { useAuth } from '@broker/api'
import { AppLayout, initialsFromUsername, OrganizationSelect } from '@broker/ui'
import { useNavigate } from 'react-router-dom'
import {
  sellerBottomItems,
  sellerBrand,
  sellerNavItems,
} from '../config/navigation'

export function SellerLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    void navigate('/login')
  }

  return (
    <AppLayout
      headerTitle="Portal vendedores"
      headerExtra={<OrganizationSelect />}
      navItems={sellerNavItems}
      bottomItems={sellerBottomItems}
      brand={sellerBrand}
      user={
        user
          ? {
              name: user.username,
              role: 'Portal vendedores',
              initials: initialsFromUsername(user.username),
            }
          : undefined
      }
      onLogout={handleLogout}
    />
  )
}
