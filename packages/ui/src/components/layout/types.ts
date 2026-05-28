import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  exact?: boolean
}

export type SidebarBrand = {
  title: string
  subtitle: string
  icon: LucideIcon
}

export type SidebarCta = {
  label: string
  icon: LucideIcon
  onClick?: () => void
}

export type SidebarProps = {
  isOpen: boolean
  onClose: () => void
  navItems: NavItem[]
  bottomItems?: NavItem[]
  brand: SidebarBrand
  cta?: SidebarCta
}

export type TopHeaderUser = {
  name: string
  role: string
  initials: string
}

export type TopHeaderProps = {
  title?: string
  onMenuClick?: () => void
  onLogout?: () => void
  user?: TopHeaderUser
  headerExtra?: ReactNode
}

export type AppLayoutProps = {
  headerTitle?: string
  navItems: NavItem[]
  bottomItems?: NavItem[]
  brand: SidebarBrand
  cta?: SidebarCta
  onLogout?: () => void
  user?: TopHeaderUser
  headerExtra?: ReactNode
}
