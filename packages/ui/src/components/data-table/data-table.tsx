import { useMemo } from 'react'

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

const PAGE_SIZE = 10

const alignClassName = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

const hideOnClassName = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
} as const

function columnVisibilityClass<TData>(column: ColumnDef<TData>) {
  return column.hideOn ? hideOnClassName[column.hideOn] : undefined
}

function getCellValue<TData>(row: TData, column: ColumnDef<TData>): unknown {
  const key = column.accessor ?? column.id
  return (row as Record<string, unknown>)[key]
}

function resolveRowId<TData>(
  row: TData,
  index: number,
  getRowId?: (row: TData) => string,
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

function LoadingRows<TData>({ columns }: { columns: ColumnDef<TData>[] }) {
  return (
    <>
      {Array.from({ length: 3 }).map((_, rowIndex) => (
        <TableRow key={`loading-${rowIndex}`}>
          {columns.map((column) => (
            <TableCell
              key={`loading-${rowIndex}-${column.id}`}
              data-column={column.id}
              className={cn(columnVisibilityClass(column), column.className)}
            >
              <div className="h-3.5 w-full max-w-[12rem] animate-pulse rounded bg-muted" />
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
  const isClientPagination = pagination.total === undefined
  const total = pagination.total ?? data.length
  const pageSize = pagination.pageSize ?? PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(pagination.page, 1), totalPages)
  const pageData = useMemo(() => {
    if (!isClientPagination) {
      return data
    }

    const start = (safePage - 1) * pageSize
    return data.slice(start, start + pageSize)
  }, [data, isClientPagination, pageSize, safePage])
  const paginationBar = {
    ...pagination,
    page: safePage,
    total,
  }
  const showEmptyState = !isLoading && total === 0

  return (
    <div className={cn('broker-data-table', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.id}
                data-column={column.id}
                className={cn(
                  alignClassName[column.align ?? 'left'],
                  columnVisibilityClass(column),
                  column.className,
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <LoadingRows columns={columns} />
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
            pageData.map((row, index) => (
              <TableRow key={resolveRowId(row, index, getRowId)}>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    data-column={column.id}
                    className={cn(
                      alignClassName[column.align ?? 'left'],
                      columnVisibilityClass(column),
                      column.className,
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
      <DataTablePaginationBar {...paginationBar} />
    </div>
  )
}
