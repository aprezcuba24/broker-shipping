import { useAuth } from '@broker/api'
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
import { backofficeBottomItems, backofficeBrand, backofficeNavItems } from '../config/navigation'

export function BackofficeLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { activeOrganization } = useActiveOrganization()
  const { hasProduct, isLoading: productsLoading } = useOrganizationPlatformProducts()

  const navItems = useMemo(
    () =>
      filterNavItemsByProduct(backofficeNavItems, {
        hasProduct,
        isLoading: productsLoading,
      }),
    [hasProduct, productsLoading],
  )

  const handleLogout = () => {
    logout()
    void navigate('/login')
  }

  return (
    <>
      <AppLayout
        userMenuExtra={<OrganizationMenuSection />}
        navItems={navItems}
        bottomItems={backofficeBottomItems}
        brand={backofficeBrand}
        user={
          user
            ? {
                name: user.name,
                role: user.is_super_admin ? 'Super admin' : 'Portal B2B',
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
