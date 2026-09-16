import { Building2, LayoutDashboard } from 'lucide-react'
import { PRODUCT_NAME, type NavItem, type SidebarBrand } from '@broker/ui'

export const adminBrand: SidebarBrand = {
  title: PRODUCT_NAME,
  subtitle: 'Administración global',
  icon: Building2,
}

export const adminNavItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
]

export const adminBottomItems: NavItem[] = []
