import {
  Ban,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Package,
  Boxes,
  Store,
  Tag,
  Users,
  Warehouse,
} from 'lucide-react'
import { PRODUCT_NAME, type NavItem, type SidebarBrand } from '@broker/ui'

export const backofficeBrand: SidebarBrand = {
  title: PRODUCT_NAME,
  subtitle: 'Proveedores',
  icon: Warehouse,
}

export const backofficeNavItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/orders', label: 'Órdenes', icon: ClipboardList },
  { to: '/commissions', label: 'Comisiones', icon: CircleDollarSign },
  { to: '/products', label: 'Productos', icon: Package },
  { to: '/inventory', label: 'Inventario', icon: Boxes },
  { to: '/tags', label: 'Etiquetas', icon: Tag },
  { to: '/phone-blacklist', label: 'Lista negra', icon: Ban },
  { to: '/sellers', label: 'Vendedores', icon: Store },
  { to: '/members', label: 'Miembros', icon: Users },
]

export const backofficeBottomItems: NavItem[] = []
