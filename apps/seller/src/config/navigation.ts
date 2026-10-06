import {
  Ban,
  CircleDollarSign,
  ClipboardList,
  Contact,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Truck,
  Users,
} from 'lucide-react'
import { PlatformProductCode } from '@broker/api'
import { PRODUCT_NAME, type NavItem, type SidebarBrand } from '@broker/ui'

export const sellerBrand: SidebarBrand = {
  title: PRODUCT_NAME,
  subtitle: 'Gestores',
  icon: ShoppingBag,
}

export const sellerNavItems: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    exact: true,
    requiresProduct: PlatformProductCode.provider_management,
  },
  {
    to: '/products',
    label: 'Productos',
    icon: Package,
    requiresProduct: PlatformProductCode.provider_management,
  },
  {
    to: '/customers',
    label: 'Clientes',
    icon: Contact,
    requiresProduct: PlatformProductCode.provider_management,
  },
  {
    to: '/phone-blacklist',
    label: 'Lista negra',
    icon: Ban,
    requiresProduct: PlatformProductCode.phone_blacklist,
  },
  {
    to: '/orders',
    label: 'Órdenes',
    icon: ClipboardList,
    requiresProduct: PlatformProductCode.provider_management,
  },
  {
    to: '/commissions',
    label: 'Comisiones',
    icon: CircleDollarSign,
    requiresProduct: PlatformProductCode.provider_management,
  },
  {
    to: '/providers',
    label: 'Proveedores',
    icon: Truck,
    requiresProduct: PlatformProductCode.provider_management,
  },
  { to: '/members', label: 'Miembros', icon: Users, requiresProduct: PlatformProductCode.provider_management },
]

export const sellerBottomItems: NavItem[] = [
  {
    to: '/settings',
    label: 'Configurar',
    icon: Settings,
    requiresProduct: PlatformProductCode.provider_management,
  },
]
