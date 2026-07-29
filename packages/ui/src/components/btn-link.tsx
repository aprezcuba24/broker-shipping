import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button, type ButtonProps } from './button'

export type BtnLinkProps = Omit<
  ButtonProps,
  'asChild' | 'children' | 'onClick' | 'label' | 'icon'
> & {
  to: string
  icon?: LucideIcon
  children?: ReactNode
}

export function BtnLink({ to, icon: Icon, children, size, ...buttonProps }: BtnLinkProps) {
  const isIconOnly = Icon !== undefined && children == null
  const resolvedSize = size ?? (isIconOnly ? 'icon' : 'sm')

  return (
    <Button asChild size={resolvedSize} {...buttonProps}>
      <Link to={to}>
        {Icon ? <Icon aria-hidden /> : null}
        {children}
      </Link>
    </Button>
  )
}
