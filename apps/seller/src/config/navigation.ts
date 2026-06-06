import { HelpCircle, LayoutDashboard, Package, Settings, Store } from 'lucide-react'
import type { NavItem, SidebarBrand } from '@broker/ui'

export const sellerBrand: SidebarBrand = {
  title: 'Broker',
  subtitle: 'Portal vendedores',
  icon: Store,
}

export const sellerNavItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/products', label: 'Catálogo', icon: Package },
]

export const sellerBottomItems: NavItem[] = [
  { to: '/settings', label: 'Configuración', icon: Settings },
  { to: '/support', label: 'Soporte', icon: HelpCircle },
]
