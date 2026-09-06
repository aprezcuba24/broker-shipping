import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Sidebar } from './sidebar'
import { TopHeader } from './top-header'
import type { AppLayoutProps } from './types'

export function AppLayout({
  headerTitle,
  portalBadge,
  navItems,
  bottomItems,
  brand,
  cta,
  onLogout,
  user,
  userMenuExtra,
  headerExtra,
  headerActions,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navItems={navItems}
        bottomItems={bottomItems}
        brand={brand}
        cta={cta}
      />
      <main className="relative flex h-screen min-w-0 flex-1 flex-col overflow-hidden lg:ml-0">
        <TopHeader
          title={headerTitle}
          portalBadge={portalBadge}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
          user={user}
          userMenuExtra={userMenuExtra}
          headerExtra={headerExtra}
          headerActions={headerActions}
        />
        <div className="custom-scrollbar flex-1 overflow-y-auto bg-background p-4 min-w-0 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
