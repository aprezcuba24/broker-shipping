import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  Mail,
  Package,
  Store,
} from 'lucide-react'
import type { NavItem, SidebarBrand } from '@broker/ui'

export const sellerBrand: SidebarBrand = {
  title: 'Broker',
  subtitle: 'Portal vendedores',
  icon: Store,
}

export const sellerNavItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/products', label: 'Productos', icon: Package },
  { to: '/orders', label: 'Órdenes', icon: ClipboardList },
  { to: '/settings/invitations', label: 'Invitaciones', icon: Mail },
  { to: '/settings/organizations', label: 'Organizaciones', icon: Building2 },
]

export const sellerBottomItems: NavItem[] = []
