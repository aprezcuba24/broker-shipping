import { Building2, LayoutDashboard, Link2, Mail, Store } from 'lucide-react'
import type { NavItem, SidebarBrand } from '@broker/ui'

export const sellerBrand: SidebarBrand = {
  title: 'Broker',
  subtitle: 'Portal vendedores',
  icon: Store,
}

export const sellerNavItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/providers/link-request', label: 'Proveedores', icon: Link2 },
  { to: '/settings/invitations', label: 'Invitaciones', icon: Mail },
  { to: '/settings/organizations', label: 'Organizaciones', icon: Building2 },
]

export const sellerBottomItems: NavItem[] = []
