import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import type { DataTablePagination } from './types'

type DataTablePaginationProps = DataTablePagination & {
  className?: string
}

export function DataTablePaginationBar({
  page,
  pageSize,
  total,
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
        'flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        {total === 0
          ? 'No hay resultados'
          : `Mostrando ${start}–${end} de ${total}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" />
          Anterior
        </Button>
        <span className="min-w-[7rem] text-center text-sm text-muted-foreground">
          Página {safePage} de {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          aria-label="Página siguiente"
        >
          Siguiente
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
