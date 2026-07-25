import { ArrowLeft, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from './button'
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
      buttons={
        backTo
          ? [
              <Button key="back" variant="outline" size="sm" asChild>
                <Link to={backTo}>
                  <ArrowLeft className="h-4 w-4" />
                  {backLabel}
                </Link>
              </Button>,
            ]
          : undefined
      }
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </PageWrapper>
  )
}
