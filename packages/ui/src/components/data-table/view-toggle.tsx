import { LayoutGrid, List } from 'lucide-react'

import { Button } from '../button'
import type { DataTableView } from './types'

export type DataTableViewToggleProps = {
  value: DataTableView
  onChange: (view: DataTableView) => void
  views: DataTableView[]
}

export function DataTableViewToggle({ value, onChange, views }: DataTableViewToggleProps) {
  const showRows = views.includes('rows')
  const showCards = views.includes('cards')

  if (!showRows || !showCards) {
    return null
  }

  return (
    <div
      role="group"
      aria-label="Cambiar vista"
      className="flex items-center gap-0.5 rounded-lg border border-surface-container-high bg-surface-container-lowest p-0.5"
    >
      <Button
        type="button"
        variant={value === 'rows' ? 'secondary' : 'ghost'}
        size="icon-sm"
        aria-label="Vista de filas"
        aria-pressed={value === 'rows'}
        onClick={() => onChange('rows')}
      >
        <List aria-hidden />
      </Button>
      <Button
        type="button"
        variant={value === 'cards' ? 'secondary' : 'ghost'}
        size="icon-sm"
        aria-label="Vista de tarjetas"
        aria-pressed={value === 'cards'}
        onClick={() => onChange('cards')}
      >
        <LayoutGrid aria-hidden />
      </Button>
    </div>
  )
}
