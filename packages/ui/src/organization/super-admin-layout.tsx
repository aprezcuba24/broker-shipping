import { useAuth } from '@broker/api'
import {
  Building2,
  Map,
  MapPinned,
  Shield,
  MapPinHouse,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/app-layout'
import type { NavItem, SidebarBrand } from '../components/layout/types'
import { PRODUCT_NAME } from '../lib/brand'
import { initialsFromName } from '../lib/initials'
import { CreateOrganizationDialogHost } from './create-organization-dialog-host'
import { OrganizationMenuSection } from './organization-menu-section'

const superAdminBrand: SidebarBrand = {
  title: PRODUCT_NAME,
  subtitle: 'Super admin',
  icon: Shield,
}

const superAdminNavItems: NavItem[] = [
  { to: '/organizations', label: 'Organizaciones', icon: Building2, exact: true },
  { to: '/provinces', label: 'Provincias', icon: Map },
  { to: '/municipalities', label: 'Municipios', icon: MapPinned },
  { to: '/neighborhoods', label: 'Barrios', icon: MapPinHouse },
]

export function SuperAdminLayout() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    void navigate('/login')
  }

  return (
    <>
      <div className="broker-super-admin-shell h-screen">
        <AppLayout
          portalBadge="Administración"
          userMenuExtra={<OrganizationMenuSection />}
          navItems={superAdminNavItems}
          brand={superAdminBrand}
          user={
            user
              ? {
                  name: user.name,
                  role: 'Super admin',
                  initials: initialsFromName(user.name),
                }
              : undefined
          }
          onLogout={handleLogout}
        />
      </div>
      <CreateOrganizationDialogHost />
    </>
  )
}
