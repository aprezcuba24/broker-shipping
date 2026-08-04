import { useAuth } from '@broker/api'
import {
  AppLayout,
  initialsFromName,
  OrganizationMenuSection,
  useActiveOrganization,
} from '@broker/ui'
import { useNavigate } from 'react-router-dom'

import { CartHeaderButton } from '../components/cart-header-button'
import { sellerBottomItems, sellerBrand, sellerNavItems } from '../config/navigation'

export function SellerLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { activeOrganization } = useActiveOrganization()

  const handleLogout = () => {
    logout()
    void navigate('/login')
  }

  return (
    <AppLayout
      userMenuExtra={<OrganizationMenuSection />}
      headerActions={<CartHeaderButton />}
      navItems={sellerNavItems}
      bottomItems={sellerBottomItems}
      brand={sellerBrand}
      user={
        user
          ? {
              name: user.name,
              role: 'Portal vendedores',
              organization: activeOrganization?.name,
              initials: initialsFromName(user.name),
            }
          : undefined
      }
      onLogout={handleLogout}
    />
  )
}
