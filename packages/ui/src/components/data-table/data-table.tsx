import { cn } from '../../lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'
import { formatCellValue, inferColumnType } from './formatters'
import { DataTablePaginationBar } from './pagination'
import type { ColumnDef, DataTableProps } from './types'

const alignClassName = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

function getCellValue<TData>(row: TData, column: ColumnDef<TData>): unknown {
  const key = column.accessor ?? column.id
  return (row as Record<string, unknown>)[key]
}

function resolveRowId<TData>(
  row: TData,
  index: number,
  getRowId?: (row: TData) => string
): string {
  if (getRowId) {
    return getRowId(row)
  }
  const id = (row as { id?: unknown }).id
  return id !== undefined && id !== null ? String(id) : String(index)
}

function renderCellContent<TData>(row: TData, column: ColumnDef<TData>) {
  if (column.cell) {
    return column.cell(row)
  }

  const fieldName = column.accessor ?? column.id
  const value = getCellValue(row, column)
  const type = inferColumnType(fieldName, value, column.type)
  return formatCellValue(value, type)
}

function LoadingRows({ columnCount }: { columnCount: number }) {
  return (
    <>
      {Array.from({ length: 3 }).map((_, rowIndex) => (
        <TableRow key={`loading-${rowIndex}`}>
          {Array.from({ length: columnCount }).map((__, colIndex) => (
            <TableCell key={`loading-${rowIndex}-${colIndex}`}>
              <div className="h-4 w-full max-w-[12rem] animate-pulse rounded bg-muted" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

export function DataTable<TData>({
  columns,
  data,
  pagination,
  getRowId,
  isLoading = false,
  emptyMessage = 'No hay datos',
  className,
}: DataTableProps<TData>) {
  const showEmptyState = !isLoading && data.length === 0

  return (
    <div className={cn('rounded-md border border-border bg-card', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={cn(
                  alignClassName[column.align ?? 'left'],
                  column.className
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <LoadingRows columnCount={columns.length} />
          ) : showEmptyState ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow key={resolveRowId(row, index, getRowId)}>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      alignClassName[column.align ?? 'left'],
                      column.className
                    )}
                  >
                    {renderCellContent(row, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <DataTablePaginationBar {...pagination} />
    </div>
  )
}
