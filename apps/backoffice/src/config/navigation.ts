import {
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Link2,
  Package,
  Tag,
  Users,
  Warehouse,
} from 'lucide-react'
import type { NavItem, SidebarBrand } from '@broker/ui'

export const backofficeBrand: SidebarBrand = {
  title: 'Broker',
  subtitle: 'Proveedores',
  icon: Warehouse,
}

export const backofficeNavItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/orders', label: 'Órdenes', icon: ClipboardList },
  { to: '/commissions', label: 'Comisiones', icon: CircleDollarSign },
  { to: '/products', label: 'Productos', icon: Package },
  { to: '/tags', label: 'Etiquetas', icon: Tag },
  { to: '/members', label: 'Miembros', icon: Users },
  { to: '/settings/invitations', label: 'Solicitudes de enlace', icon: Link2 },
]

export const backofficeBottomItems: NavItem[] = []
