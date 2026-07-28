import { Building2, LayoutDashboard } from 'lucide-react'
import type { NavItem, SidebarBrand } from '@broker/ui'

export const adminBrand: SidebarBrand = {
  title: 'Broker',
  subtitle: 'Administración global',
  icon: Building2,
}

export const adminNavItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
]

export const adminBottomItems: NavItem[] = []
