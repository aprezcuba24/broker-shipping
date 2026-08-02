import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  Link2,
  Package,
  Store,
  Tag,
  Users,
} from 'lucide-react'
import type { NavItem, SidebarBrand } from '@broker/ui'

export const backofficeBrand: SidebarBrand = {
  title: 'Broker',
  subtitle: 'Portal proveedores',
  icon: Store,
}

export const backofficeNavItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/orders', label: 'Órdenes', icon: ClipboardList },
  { to: '/products', label: 'Productos', icon: Package },
  { to: '/tags', label: 'Etiquetas', icon: Tag },
  { to: '/members', label: 'Miembros', icon: Users },
  { to: '/settings/invitations', label: 'Solicitudes de enlace', icon: Link2 },
  { to: '/settings/organizations', label: 'Organizaciones', icon: Building2 },
]

export const backofficeBottomItems: NavItem[] = []
