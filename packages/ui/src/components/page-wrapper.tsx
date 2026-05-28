import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { BtnList } from './btn-list'
import { HeaderPage } from './header-page'

export type PageWrapperProps = {
  title: string
  description?: string
  icon?: LucideIcon
  buttons?: ReactNode[]
  children: ReactNode
}

export function PageWrapper({
  title,
  description,
  icon,
  buttons,
  children,
}: PageWrapperProps) {
  return (
    <div className="space-y-6">
      <HeaderPage title={title} description={description} icon={icon}>
        {buttons?.length ? <BtnList>{buttons}</BtnList> : null}
      </HeaderPage>
      {children}
    </div>
  )
}
