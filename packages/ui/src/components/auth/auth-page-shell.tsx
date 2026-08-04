import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type PortalVariant = 'provider' | 'seller'

export type AuthPortalBranding = {
  variant: PortalVariant
  badge: string
  tagline: string
  icon: LucideIcon
}

export type AuthPageShellProps = AuthPortalBranding & {
  children: ReactNode
}

export function AuthPageShell({
  variant,
  badge,
  tagline,
  icon: Icon,
  children,
}: AuthPageShellProps) {
  const ariaLabel =
    variant === 'provider' ? 'Portal de proveedores de Broker' : 'Portal de vendedores de Broker'

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Desktop brand panel */}
      <aside
        className="hidden md:flex md:w-[42%] lg:w-[40%] flex-col justify-between bg-ds-primary text-on-primary p-10 lg:p-14 relative overflow-hidden"
        aria-label={ariaLabel}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 0.5px, transparent 0.5px), radial-gradient(circle at 80% 60%, white 0.5px, transparent 0.5px)',
            backgroundSize: '24px 24px, 32px 32px',
          }}
          aria-hidden
        />
        <div className="relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-8">
            <Icon className="h-7 w-7" aria-hidden />
          </div>
          <p className="font-headline text-3xl lg:text-4xl font-extrabold tracking-tight">Broker</p>
          <p className="mt-2 text-sm uppercase tracking-widest text-on-primary/70 font-medium">
            {badge}
          </p>
        </div>
        <p className="relative z-10 text-base lg:text-lg text-on-primary/85 leading-relaxed max-w-sm font-body">
          {tagline}
        </p>
      </aside>

      {/* Mobile brand bar */}
      <div
        className="md:hidden flex items-center gap-3 bg-ds-primary text-on-primary px-4 py-3"
        aria-label={ariaLabel}
      >
        <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="font-headline font-extrabold text-base leading-tight">Broker</p>
          <p className="text-[10px] uppercase tracking-widest text-on-primary/70 truncate">{badge}</p>
        </div>
      </div>

      {/* Form column */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-4">
          <span className="inline-flex items-center rounded-full bg-primary-container px-3 py-1 text-xs font-semibold text-on-primary-container">
            {badge}
          </span>
          {children}
        </div>
      </div>
    </div>
  )
}
