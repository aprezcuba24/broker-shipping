import {
  HelpCircle,
  LayoutDashboard,
  Package,
  Settings,
  Store,
} from 'lucide-react'
import type { NavItem, SidebarBrand } from '@broker/ui'

export const backofficeBrand: SidebarBrand = {
  title: 'Broker',
  subtitle: 'Portal proveedores',
  icon: Store,
}

export const backofficeNavItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/catalog', label: 'Catálogo', icon: Package },
]

export const backofficeBottomItems: NavItem[] = [
  { to: '/settings', label: 'Configuración', icon: Settings },
  { to: '/support', label: 'Soporte', icon: HelpCircle },
]

export const backofficeUser = {
  name: 'Proveedor',
  role: 'Portal B2B',
  initials: 'P',
}
