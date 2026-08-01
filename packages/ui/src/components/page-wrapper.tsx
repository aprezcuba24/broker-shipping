import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { BtnList } from './btn-list'
import { HeaderPage } from './header-page'
import { PageEmptyState, type PageEmptyStateProps } from './page-empty-state'

export type PageWrapperProps = {
  title: string
  description?: string
  icon?: LucideIcon
  leading?: ReactNode
  buttons?: ReactNode[] | null
  empty?: PageEmptyStateProps | null
  children: ReactNode
}

export function PageWrapper({
  title,
  description,
  icon,
  leading,
  buttons,
  empty,
  children,
}: PageWrapperProps) {
  return (
    <div className="space-y-6">
      <HeaderPage title={title} description={description} icon={icon} leading={leading}>
        {buttons?.length ? <BtnList>{buttons}</BtnList> : null}
      </HeaderPage>
      {empty != null ? <PageEmptyState {...empty} /> : children}
    </div>
  )
}
