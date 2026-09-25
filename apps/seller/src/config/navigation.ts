import {
  CircleDollarSign,
  ClipboardList,
  Contact,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Truck,
  Users,
} from 'lucide-react'
import { PRODUCT_NAME, type NavItem, type SidebarBrand } from '@broker/ui'

export const sellerBrand: SidebarBrand = {
  title: PRODUCT_NAME,
  subtitle: 'Vendedores',
  icon: ShoppingBag,
}

export const sellerNavItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/products', label: 'Productos', icon: Package },
  { to: '/customers', label: 'Clientes', icon: Contact },
  { to: '/orders', label: 'Órdenes', icon: ClipboardList },
  { to: '/commissions', label: 'Comisiones', icon: CircleDollarSign },
  { to: '/providers', label: 'Proveedores', icon: Truck },
  { to: '/members', label: 'Miembros', icon: Users },
]

export const sellerBottomItems: NavItem[] = []
