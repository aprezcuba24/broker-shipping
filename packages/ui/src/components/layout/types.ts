import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import type { PlatformProductCode } from '@broker/api'

export type NavItem = {
  /** Route for leaf items. Optional for group parents that only expand children. */
  to?: string
  label: string
  icon: LucideIcon
  exact?: boolean
  requiresProduct?: PlatformProductCode
  children?: NavItem[]
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
  organization?: string
  initials: string
}

export type TopHeaderProps = {
  title?: string
  portalBadge?: string
  onMenuClick?: () => void
  onLogout?: () => void
  user?: TopHeaderUser
  userMenuExtra?: ReactNode
  headerExtra?: ReactNode
  headerActions?: ReactNode
}

export type AppLayoutProps = {
  headerTitle?: string
  portalBadge?: string
  navItems: NavItem[]
  bottomItems?: NavItem[]
  brand: SidebarBrand
  cta?: SidebarCta
  onLogout?: () => void
  user?: TopHeaderUser
  userMenuExtra?: ReactNode
  headerExtra?: ReactNode
  headerActions?: ReactNode
}
