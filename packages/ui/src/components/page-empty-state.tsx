import type { ReactNode } from 'react'

export type PageEmptyStateProps = {
  message: string
  action?: ReactNode
}

export function PageEmptyState({ message, action }: PageEmptyStateProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  )
}
