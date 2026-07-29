import type { ReactNode } from 'react'

import { ListFilterBar, type ListFilterBarProps } from '../../components/list-filter-bar'

export type FilterBarProps = ListFilterBarProps & {
  children: ReactNode
}

/** Instant filter layout. Wire controls with `list.setFilter` / `DebouncedInput`. */
export function FilterBar({ children, className }: FilterBarProps) {
  return <ListFilterBar className={className}>{children}</ListFilterBar>
}
