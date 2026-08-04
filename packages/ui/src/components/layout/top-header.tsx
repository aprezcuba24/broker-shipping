import { ChevronDown, LogOut, Menu, Search } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../dropdown-menu'
import type { TopHeaderProps } from './types'

const defaultUser = {
  name: 'Usuario',
  role: 'Acceso',
  initials: 'U',
}

export function TopHeader({
  title,
  portalBadge,
  onMenuClick,
  onLogout,
  user = defaultUser,
  headerExtra,
  headerActions,
}: TopHeaderProps) {
  return (
    <header className="bg-surface-container-low/80 backdrop-blur-md sticky top-0 z-40 flex justify-between items-center w-full px-3 sm:px-6 py-3">
      <div className="flex flex-1 min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 hover:bg-surface-container-highest/50 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5 text-on-surface" />
          </button>

          {title ? (
            <span className="text-lg sm:text-xl font-bold tracking-tight font-headline text-on-surface truncate">
              {title}
            </span>
          ) : null}
          {portalBadge ? (
            <span className="shrink-0 inline-flex items-center rounded-full bg-primary-container px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-on-primary-container">
              {portalBadge}
            </span>
          ) : null}
        </div>

        {headerExtra ? (
          <div className="w-full min-w-0 sm:w-auto sm:max-w-[14rem] sm:shrink-0">{headerExtra}</div>
        ) : null}

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

      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        {headerActions}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 sm:gap-3 rounded-full pl-2 pr-1 py-1 hover:bg-surface-container-highest/50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Menú de usuario"
            >
              <UserMeta user={user} />
              <div className="w-8 h-8 rounded-full bg-ds-primary text-on-primary flex items-center justify-center text-xs font-bold border-2 border-ds-primary/20 shrink-0">
                {user.initials}
              </div>
              <ChevronDown className="hidden sm:block h-4 w-4 text-on-surface-variant shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="min-w-44">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-on-surface">{user.name}</span>
                <span className="text-xs text-muted-foreground">{user.role}</span>
              </div>
            </DropdownMenuLabel>
            {onLogout ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onLogout()}>
                  <LogOut />
                  Salir
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
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
