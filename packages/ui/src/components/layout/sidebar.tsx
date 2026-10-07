import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { NavItem, SidebarProps } from './types'

const linkBaseClassName =
  'flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 hover:translate-x-1'

const linkInactiveClassName =
  'text-on-surface-variant hover:bg-surface-container-highest/50'

const linkActiveClassName = 'bg-ds-primary text-on-primary shadow-sm font-semibold'

function isPathActive(pathname: string, to: string, exact?: boolean): boolean {
  if (exact) return pathname === to
  return pathname === to || pathname.startsWith(`${to}/`)
}

function itemOrChildIsActive(item: NavItem, pathname: string): boolean {
  if (item.to && isPathActive(pathname, item.to, item.exact)) return true
  return (item.children ?? []).some((child) => itemOrChildIsActive(child, pathname))
}

export function Sidebar({ isOpen, onClose, navItems, bottomItems = [], brand, cta }: SidebarProps) {
  const BrandIcon = brand.icon

  return (
    <>
      {isOpen ? (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      ) : null}

      <aside
        className={[
          'h-screen w-64 bg-surface-container-low flex flex-col p-4 gap-2 text-sm font-medium text-on-surface',
          'border-l-[3px] border-ds-primary',
          'fixed lg:static left-0 top-0 z-50',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        <div className="mb-8 px-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-ds-primary rounded-lg flex items-center justify-center text-on-primary">
              <BrandIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="font-headline text-lg font-extrabold">{brand.title}</div>
              <div className="text-[10px] uppercase tracking-widest text-ds-primary font-bold">
                {brand.subtitle}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-surface-container-highest rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <SidebarNavEntry key={item.to ?? item.label} item={item} onClose={onClose} />
          ))}
        </nav>

        <div className="mt-auto pt-4 space-y-1">
          {cta ? (
            <button
              type="button"
              onClick={cta.onClick}
              className="w-full mb-4 py-2.5 px-4 bg-ds-primary text-on-primary rounded-xl font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-primary-dim"
            >
              <cta.icon className="h-4 w-4" />
              <span>{cta.label}</span>
            </button>
          ) : null}

          {bottomItems.map((item) => (
            <SidebarNavEntry key={item.to ?? item.label} item={item} onClose={onClose} />
          ))}
        </div>
      </aside>
    </>
  )
}

function SidebarNavEntry({
  item,
  onClose,
}: {
  item: NavItem
  onClose: () => void
}) {
  if (item.children && item.children.length > 0) {
    return <SidebarNavGroup item={item} onClose={onClose} />
  }
  if (!item.to) return null
  return (
    <SidebarNavLink
      item={{
        to: item.to,
        label: item.label,
        icon: item.icon,
        exact: item.exact,
      }}
      onClose={onClose}
    />
  )
}

function SidebarNavGroup({
  item,
  onClose,
}: {
  item: NavItem
  onClose: () => void
}) {
  const location = useLocation()
  const childActive = itemOrChildIsActive(item, location.pathname)
  const [open, setOpen] = useState(childActive)
  const Icon = item.icon

  useEffect(() => {
    if (childActive) setOpen(true)
  }, [childActive])

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={[
          linkBaseClassName,
          'w-full text-left',
          childActive ? 'text-ds-primary font-semibold' : linkInactiveClassName,
        ].join(' ')}
      >
        <Icon className="h-[18px] w-[18px]" />
        <span className="flex-1">{item.label}</span>
        <ChevronDown
          className={[
            'h-4 w-4 shrink-0 transition-transform duration-200',
            open ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>
      {open ? (
        <div className="ml-3 space-y-1 border-l border-outline-variant/40 pl-2">
          {item.children?.map((child) => (
            <SidebarNavEntry
              key={child.to ?? child.label}
              item={child}
              onClose={onClose}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function SidebarNavLink({
  item,
  onClose,
}: {
  item: { to: string; label: string; icon: LucideIcon; exact?: boolean }
  onClose: () => void
}) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      end={item.exact}
      onClick={() => onClose()}
      className={({ isActive }) =>
        [linkBaseClassName, isActive ? linkActiveClassName : linkInactiveClassName].join(' ')
      }
    >
      <Icon className="h-[18px] w-[18px]" />
      <span>{item.label}</span>
    </NavLink>
  )
}
