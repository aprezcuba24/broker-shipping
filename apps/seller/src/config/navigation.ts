import {
  Building2,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Truck,
  Users,
} from 'lucide-react'
import type { NavItem, SidebarBrand } from '@broker/ui'

export const sellerBrand: SidebarBrand = {
  title: 'Broker',
  subtitle: 'Vendedores',
  icon: ShoppingBag,
}

export const sellerNavItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/products', label: 'Productos', icon: Package },
  { to: '/orders', label: 'Órdenes', icon: ClipboardList },
  { to: '/commissions', label: 'Comisiones', icon: CircleDollarSign },
  { to: '/providers', label: 'Proveedores', icon: Truck },
  { to: '/members', label: 'Miembros', icon: Users },
  { to: '/settings/organizations', label: 'Organizaciones', icon: Building2 },
]

export const sellerBottomItems: NavItem[] = []
