import { useAuth } from '@broker/api'
import {
  AppLayout,
  initialsFromName,
  OrganizationMenuSection,
  useActiveOrganization,
} from '@broker/ui'
import { useNavigate } from 'react-router-dom'
import { backofficeBottomItems, backofficeBrand, backofficeNavItems } from '../config/navigation'

export function BackofficeLayout() {
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
      navItems={backofficeNavItems}
      bottomItems={backofficeBottomItems}
      brand={backofficeBrand}
      user={
        user
          ? {
              name: user.name,
              role: 'Portal B2B',
              organization: activeOrganization?.name,
              initials: initialsFromName(user.name),
            }
          : undefined
      }
      onLogout={handleLogout}
    />
  )
}
