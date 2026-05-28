import { Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Sidebar } from './sidebar'
import { TopHeader } from './top-header'
import type { AppLayoutProps } from './types'

export function AppLayout({
  headerTitle,
  navItems,
  bottomItems,
  brand,
  cta,
  onLogout,
  user,
  headerExtra,
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
      <main className="flex-1 flex flex-col h-screen relative overflow-hidden lg:ml-0">
        <TopHeader
          title={headerTitle}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={onLogout}
          user={user}
          headerExtra={headerExtra}
        />
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-background">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
