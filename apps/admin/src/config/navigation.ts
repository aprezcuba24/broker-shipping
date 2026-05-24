import {
  Building2,
  HelpCircle,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react'
import type { NavItem, SidebarBrand } from '@broker/ui'

export const adminBrand: SidebarBrand = {
  title: 'Broker',
  subtitle: 'Administración global',
  icon: Building2,
}

export const adminNavItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/organizations', label: 'Organizaciones', icon: Building2 },
  { to: '/users', label: 'Usuarios', icon: Users },
]

export const adminBottomItems: NavItem[] = [
  { to: '/settings', label: 'Configuración', icon: Settings },
  { to: '/support', label: 'Soporte', icon: HelpCircle },
]

export const adminUser = {
  name: 'Administrador',
  role: 'Acceso global',
  initials: 'A',
}
