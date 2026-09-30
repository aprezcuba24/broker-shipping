import { ChevronRight, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { cn } from '../lib/utils'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'

export type SettingsOptionCardProps = {
  to: string
  title: string
  description?: string
  icon: LucideIcon
  className?: string
}

export function SettingsOptionCard({
  to,
  title,
  description,
  icon: Icon,
  className,
}: SettingsOptionCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        'group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-muted/30">
        <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base font-semibold leading-snug">
              {title}
            </CardTitle>
            {description ? (
              <CardDescription className="text-sm leading-relaxed">
                {description}
              </CardDescription>
            ) : null}
          </div>
          <ChevronRight
            className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
            aria-hidden
          />
        </CardHeader>
      </Card>
    </Link>
  )
}
