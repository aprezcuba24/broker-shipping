import { ArrowLeft, type LucideIcon } from 'lucide-react'

import { BtnLink } from './btn-link'
import { PageWrapper } from './page-wrapper'

export type PageMessageProps = {
  title: string
  message: string
  icon?: LucideIcon
  backTo?: string
  backLabel?: string
}

export function PageMessage({
  title,
  message,
  icon,
  backTo,
  backLabel = 'Volver',
}: PageMessageProps) {
  return (
    <PageWrapper
      title={title}
      icon={icon}
      leading={
        backTo ? (
          <BtnLink
            to={backTo}
            variant="outline"
            size="icon-sm"
            icon={ArrowLeft}
            aria-label={backLabel}
          />
        ) : undefined
      }
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </PageWrapper>
  )
}
