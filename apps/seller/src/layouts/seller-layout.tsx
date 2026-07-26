import { useAuth } from '@broker/api'
import { AppLayout, initialsFromName } from '@broker/ui'
import { useNavigate } from 'react-router-dom'
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
      headerTitle="Portal vendedores"
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
