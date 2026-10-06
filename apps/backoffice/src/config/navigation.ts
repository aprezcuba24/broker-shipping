import {
  Ban,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Package,
  Boxes,
  Settings,
  Store,
  Tag,
  Users,
  Warehouse,
} from 'lucide-react'
import { PlatformProductCode } from '@broker/api'
import { PRODUCT_NAME, type NavItem, type SidebarBrand } from '@broker/ui'

export const backofficeBrand: SidebarBrand = {
  title: PRODUCT_NAME,
  subtitle: 'Proveedores',
  icon: Warehouse,
}

export const backofficeNavItems: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    exact: true,
    requiresProduct: PlatformProductCode.provider_management,
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
    to: '/products',
    label: 'Productos',
    icon: Package,
    requiresProduct: PlatformProductCode.provider_management,
  },
  {
    to: '/inventory',
    label: 'Inventario',
    icon: Boxes,
    requiresProduct: PlatformProductCode.provider_management,
  },
  {
    to: '/tags',
    label: 'Etiquetas',
    icon: Tag,
    requiresProduct: PlatformProductCode.provider_management,
  },
  {
    to: '/phone-blacklist',
    label: 'Lista negra',
    icon: Ban,
    requiresProduct: PlatformProductCode.phone_blacklist,
  },
  {
    to: '/sellers',
    label: 'Vendedores',
    icon: Store,
    requiresProduct: PlatformProductCode.provider_management,
  },
  { to: '/members', label: 'Miembros', icon: Users },
]

export const backofficeBottomItems: NavItem[] = [
  {
    to: '/settings',
    label: 'Configurar',
    icon: Settings,
    requiresProduct: PlatformProductCode.provider_management,
  },
]
