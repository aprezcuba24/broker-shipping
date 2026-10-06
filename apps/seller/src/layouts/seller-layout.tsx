import { PlatformProductCode, useAuth } from '@broker/api'
import {
  AppLayout,
  CreateOrganizationDialogHost,
  filterNavItemsByProduct,
  initialsFromName,
  OrganizationMenuSection,
  useActiveOrganization,
  useOrganizationPlatformProducts,
} from '@broker/ui'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import { CartHeaderButton } from '../components/cart-header-button'
import { sellerBottomItems, sellerBrand, sellerNavItems } from '../config/navigation'

export function SellerLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { activeOrganization } = useActiveOrganization()
  const { hasProduct, isLoading: productsLoading } = useOrganizationPlatformProducts()

  const navItems = useMemo(
    () =>
      filterNavItemsByProduct(sellerNavItems, {
        hasProduct,
        isLoading: productsLoading,
      }),
    [hasProduct, productsLoading],
  )

  const bottomItems = useMemo(
    () =>
      filterNavItemsByProduct(sellerBottomItems, {
        hasProduct,
        isLoading: productsLoading,
      }),
    [hasProduct, productsLoading],
  )

  const showCart =
    !productsLoading && hasProduct(PlatformProductCode.provider_management)

  const handleLogout = () => {
    logout()
    void navigate('/login')
  }

  return (
    <>
      <AppLayout
        userMenuExtra={<OrganizationMenuSection />}
        headerActions={showCart ? <CartHeaderButton /> : undefined}
        navItems={navItems}
        bottomItems={bottomItems}
        brand={sellerBrand}
        user={
          user
            ? {
                name: user.name,
                role: user.is_super_admin ? 'Super admin' : 'Portal gestores',
                organization: activeOrganization?.name,
                initials: initialsFromName(user.name),
              }
            : undefined
        }
        onLogout={handleLogout}
      />
      <CreateOrganizationDialogHost />
    </>
  )
}
