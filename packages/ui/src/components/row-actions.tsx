import { MoreHorizontal } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu'

export type RowActionsProps = {
  children: ReactNode
  label?: string
}

export function RowActions({ children, label = 'Acciones' }: RowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

RowActions.Item = DropdownMenuItem
RowActions.Separator = DropdownMenuSeparator
