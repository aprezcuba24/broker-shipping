import type { ReactNode } from 'react'

import { cn } from '../lib/utils'
import { Badge, type BadgeProps } from './ui/badge'

export type BadgeListItem = {
  id: string
  label: string
}

export type BadgeListProps = {
  items: BadgeListItem[]
  empty?: ReactNode
  variant?: BadgeProps['variant']
  className?: string
  badgeClassName?: string
}

export function BadgeList({
  items,
  empty = <span className="text-muted-foreground">—</span>,
  variant = 'secondary',
  className,
  badgeClassName,
}: BadgeListProps) {
  if (items.length === 0) {
    return empty
  }

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {items.map((item) => (
        <Badge key={item.id} variant={variant} className={cn('font-normal', badgeClassName)}>
          {item.label}
        </Badge>
      ))}
    </div>
  )
}
