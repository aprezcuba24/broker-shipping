import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type HeaderPageProps = {
  title: string
  description?: string
  icon?: LucideIcon
  children?: ReactNode
}

export function HeaderPage({
  title,
  description,
  icon: Icon,
  children,
}: HeaderPageProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="h-6 w-6 text-muted-foreground" /> : null}
          <h1 className="text-2xl font-headline font-semibold text-foreground">
            {title}
          </h1>
        </div>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  )
}
