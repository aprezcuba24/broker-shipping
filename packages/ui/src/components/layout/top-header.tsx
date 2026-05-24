import { Bell, LogOut, Menu, Search, Settings } from 'lucide-react'
import type { TopHeaderProps } from './types'

const defaultUser = {
  name: 'Usuario',
  role: 'Acceso',
  initials: 'U',
}

export function TopHeader({
  title = 'Panel',
  onMenuClick,
  onLogout,
  user = defaultUser,
}: TopHeaderProps) {
  return (
    <header className="bg-surface-container-low/80 backdrop-blur-md sticky top-0 z-40 flex justify-between items-center w-full px-3 sm:px-6 py-3">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 hover:bg-surface-container-highest/50 rounded-lg transition-colors"
        >
          <Menu className="h-5 w-5 text-on-surface" />
        </button>

        <span className="text-lg sm:text-xl font-bold tracking-tight font-headline text-on-surface truncate">
          {title}
        </span>

        <div className="hidden sm:block h-6 w-px bg-outline-variant/30 mx-2" />

        <div className="hidden sm:flex items-center bg-surface-container-highest px-3 py-1.5 rounded-full text-sm font-normal text-on-surface-variant flex-1 max-w-xs">
          <Search className="h-4 w-4 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent border-none focus:ring-0 focus:outline-none p-0 text-sm w-full min-w-0"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-4 shrink-0">
        <button
          type="button"
          className="p-2 rounded-full hover:bg-surface-container-highest/50 transition-colors"
        >
          <Bell className="h-[18px] w-[18px] text-on-surface-variant" />
        </button>
        {onLogout ? (
          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-full hover:bg-surface-container-highest/50 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="h-[18px] w-[18px] text-on-surface-variant" />
          </button>
        ) : null}
        <button
          type="button"
          className="hidden sm:block p-2 rounded-full hover:bg-surface-container-highest/50 transition-colors"
        >
          <Settings className="h-[18px] w-[18px] text-on-surface-variant" />
        </button>
        <div className="flex items-center gap-2 sm:gap-3 pl-2">
          <UserMeta user={user} />
          <div className="w-8 h-8 rounded-full bg-ds-primary text-on-primary flex items-center justify-center text-xs font-bold border-2 border-ds-primary/20 shrink-0">
            {user.initials}
          </div>
        </div>
      </div>
    </header>
  )
}

function UserMeta({ user }: { user: NonNullable<TopHeaderProps['user']> }) {
  return (
    <div className="text-right hidden md:block">
      <p className="text-sm font-bold leading-none text-on-surface">{user.name}</p>
      <p className="text-[10px] text-on-surface-variant">{user.role}</p>
    </div>
  )
}
