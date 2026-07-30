import { Building2, LayoutDashboard, Mail, Package, Store, Tag } from 'lucide-react'
import type { NavItem, SidebarBrand } from '@broker/ui'

export const backofficeBrand: SidebarBrand = {
  title: 'Broker',
  subtitle: 'Portal proveedores',
  icon: Store,
}

export const backofficeNavItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/products', label: 'Productos', icon: Package },
  { to: '/tags', label: 'Etiquetas', icon: Tag },
  { to: '/settings/invitations', label: 'Invitaciones', icon: Mail },
  { to: '/settings/organizations', label: 'Organizaciones', icon: Building2 },
]

export const backofficeBottomItems: NavItem[] = []
