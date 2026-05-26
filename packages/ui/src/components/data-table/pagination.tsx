import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '../../lib/utils'
import { Button } from '../button'
import type { DataTablePagination } from './types'

type DataTablePaginationProps = DataTablePagination & {
  className?: string
}

export function DataTablePaginationBar({
  page,
  pageSize = 10,
  total = 0,
  onPageChange,
  className,
}: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const end = total === 0 ? 0 : Math.min(safePage * pageSize, total)

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 border-t border-surface-container-high px-3 py-2',
        className,
      )}
    >
      <p className="hidden text-xs text-on-surface-variant sm:block">
        {total === 0
          ? 'No hay resultados'
          : `Mostrando ${start}–${end} de ${total}`}
      </p>
      <p className="text-xs text-on-surface-variant sm:hidden">
        {total === 0 ? '0' : `${start}–${end} / ${total}`}
      </p>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft />
        </Button>
        <span className="min-w-[3.5rem] text-center text-xs tabular-nums text-on-surface-variant">
          {safePage} / {totalPages}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          aria-label="Página siguiente"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
