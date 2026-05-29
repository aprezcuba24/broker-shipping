import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

export type ListFilterBarProps = {
  children: ReactNode
  className?: string
}

export function ListFilterBar({ children, className }: ListFilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:items-center [&>*:first-child]:min-w-0 [&>*:first-child]:flex-1',
        className,
      )}
    >
      {children}
    </div>
  )
}
