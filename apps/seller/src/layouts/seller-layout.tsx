import { useAuth } from '@broker/api'
import { AppLayout, initialsFromName, OrganizationSelect } from '@broker/ui'
import { useNavigate } from 'react-router-dom'

import { CartHeaderButton } from '../components/cart-header-button'
import { sellerBottomItems, sellerBrand, sellerNavItems } from '../config/navigation'

export function SellerLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    void navigate('/login')
  }

  return (
    <AppLayout
      headerExtra={<OrganizationSelect />}
      headerActions={<CartHeaderButton />}
      navItems={sellerNavItems}
      bottomItems={sellerBottomItems}
      brand={sellerBrand}
      user={
        user
          ? {
              name: user.name,
              role: 'Portal vendedores',
              initials: initialsFromName(user.name),
            }
          : undefined
      }
      onLogout={handleLogout}
    />
  )
}
