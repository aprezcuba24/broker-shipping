import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'

import { cn } from '../../lib/utils'
import { Thumbnail } from '../thumbnail'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import { formatCellValue, inferColumnType } from './formatters'
import { DataTablePaginationBar } from './pagination'
import type { ColumnDef, DataTableProps, DataTableSort, DataTableView } from './types'
import { DataTableViewToggle } from './view-toggle'

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

const hideOnCardClassName = {
  sm: 'hidden sm:flex',
  md: 'hidden md:flex',
  lg: 'hidden lg:flex',
} as const

export function columnVisibilityClass<TData>(column: ColumnDef<TData>) {
  return column.hideOn ? hideOnClassName[column.hideOn] : undefined
}

export function columnCardVisibilityClass<TData>(column: ColumnDef<TData>) {
  return column.hideOn ? hideOnCardClassName[column.hideOn] : undefined
}

function getCellValue<TData>(row: TData, column: ColumnDef<TData>): unknown {
  const key = column.accessor ?? column.id
  return (row as Record<string, unknown>)[key]
}

export function resolveRowId<TData>(
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

export function renderCellContent<TData>(row: TData, column: ColumnDef<TData>) {
  if (column.cell) {
    return column.cell(row)
  }

  const fieldName = column.accessor ?? column.id
  const value = getCellValue(row, column)
  const type = inferColumnType(fieldName, value, column.type)
  return formatCellValue(value, type)
}

export function DataTableCell<TData>({
  row,
  column,
}: {
  row: TData
  column: ColumnDef<TData>
}) {
  return (
    <TableCell
      data-column={column.id}
      className={cn(
        alignClassName[column.align ?? 'left'],
        columnVisibilityClass(column),
        column.className,
      )}
    >
      {renderCellContent(row, column)}
    </TableCell>
  )
}

export function DataTableRow<TData>({
  row,
  columns,
  className,
  onClick,
}: {
  row: TData
  columns: ColumnDef<TData>[]
  className?: string
  onClick?: () => void
}) {
  return (
    <TableRow
      className={cn(onClick && 'cursor-pointer', className)}
      onClick={onClick}
      data-clickable={onClick ? 'true' : undefined}
    >
      {columns.map((column) => (
        <DataTableCell key={column.id} row={row} column={column} />
      ))}
    </TableRow>
  )
}

function DataField<TData>({ row, column }: { row: TData; column: ColumnDef<TData> }) {
  return (
    <div
      data-column={column.id}
      className={cn(
        'broker-data-table__card-field flex items-start justify-between gap-3',
        columnCardVisibilityClass(column),
        column.className,
      )}
    >
      <span className="shrink-0 text-xs text-on-surface-variant">{column.header}</span>
      <span className="min-w-0 text-right text-sm text-on-surface">
        {renderCellContent(row, column)}
      </span>
    </div>
  )
}

export function DataTableCards<TData>({
  rows,
  columns,
  actionsColumn,
  getRowId,
  onRowClick,
  rowClassName,
}: {
  rows: TData[]
  columns: ColumnDef<TData>[]
  actionsColumn?: ColumnDef<TData>
  getRowId?: (row: TData) => string
  onRowClick?: (row: TData) => void
  rowClassName?: string | ((row: TData) => string | undefined)
}) {
  return (
    <div className="divide-y divide-surface-container-high">
      {rows.map((row, index) => {
        const resolvedClassName =
          typeof rowClassName === 'function' ? rowClassName(row) : rowClassName
        return (
          <article
            key={resolveRowId(row, index, getRowId)}
            className={cn(
              'broker-data-table__card',
              onRowClick && 'cursor-pointer',
              resolvedClassName,
            )}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            <div className="space-y-0.5">
              {columns.map((column) => (
                <DataField key={column.id} row={row} column={column} />
              ))}
            </div>
            {actionsColumn ? (
              <div
                data-column="actions"
                className="broker-data-table__card-actions flex justify-end"
                onClick={(event) => event.stopPropagation()}
              >
                {renderCellContent(row, actionsColumn)}
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

function GridCardField<TData>({ row, column }: { row: TData; column: ColumnDef<TData> }) {
  const isTitle = column.id === 'name'
  return (
    <div
      data-column={column.id}
      className={cn(
        'broker-data-table__grid-card-field',
        isTitle ? 'min-w-0' : 'flex items-start justify-between gap-2',
        column.className,
      )}
    >
      {isTitle ? null : (
        <span className="shrink-0 text-xs text-on-surface-variant">{column.header}</span>
      )}
      <span
        className={cn(
          'min-w-0 text-on-surface',
          isTitle ? 'line-clamp-2 text-sm font-medium' : 'text-right text-sm',
        )}
      >
        {renderCellContent(row, column)}
      </span>
    </div>
  )
}

function GridCardCover<TData>({ row, column }: { row: TData; column: ColumnDef<TData> }) {
  const record = row as { image_url?: string | null; name?: unknown }
  const src =
    typeof record.image_url === 'string' || record.image_url === null || record.image_url === undefined
      ? record.image_url
      : null
  const alt = typeof record.name === 'string' ? record.name : 'Imagen'

  return (
    <div data-column={column.id} className="broker-data-table__grid-card-cover">
      <Thumbnail
        src={src}
        alt={alt}
        size="lg"
        className="!size-full max-h-none w-full rounded-none border-0"
      />
    </div>
  )
}

export function DataTableCardGrid<TData>({
  rows,
  columns,
  imageColumn,
  actionsColumn,
  getRowId,
  onRowClick,
  rowClassName,
}: {
  rows: TData[]
  columns: ColumnDef<TData>[]
  imageColumn?: ColumnDef<TData>
  actionsColumn?: ColumnDef<TData>
  getRowId?: (row: TData) => string
  onRowClick?: (row: TData) => void
  rowClassName?: string | ((row: TData) => string | undefined)
}) {
  return (
    <div className="broker-data-table__grid">
      {rows.map((row, index) => {
        const resolvedClassName =
          typeof rowClassName === 'function' ? rowClassName(row) : rowClassName
        return (
          <article
            key={resolveRowId(row, index, getRowId)}
            className={cn(
              'broker-data-table__grid-card',
              onRowClick && 'cursor-pointer',
              resolvedClassName,
            )}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {imageColumn ? <GridCardCover row={row} column={imageColumn} /> : null}
            <div className="broker-data-table__grid-card-body space-y-1.5 p-3">
              {columns.map((column) => (
                <GridCardField key={column.id} row={row} column={column} />
              ))}
            </div>
            {actionsColumn ? (
              <div
                data-column="actions"
                className="broker-data-table__grid-card-actions flex justify-end px-3 pb-3"
                onClick={(event) => event.stopPropagation()}
              >
                {renderCellContent(row, actionsColumn)}
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
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

function LoadingCards<TData>({ columns }: { columns: ColumnDef<TData>[] }) {
  const dataColumns = columns.filter((column) => column.id !== 'actions')

  return (
    <>
      {Array.from({ length: 3 }).map((_, cardIndex) => (
        <article key={`loading-card-${cardIndex}`} className="broker-data-table__card">
          <div className="space-y-2">
            {dataColumns.map((column) => (
              <div
                key={`loading-card-${cardIndex}-${column.id}`}
                className={cn(
                  'broker-data-table__card-field flex items-center justify-between gap-3',
                  columnCardVisibilityClass(column),
                )}
              >
                <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </article>
      ))}
    </>
  )
}

function LoadingCardGrid() {
  return (
    <div className="broker-data-table__grid">
      {Array.from({ length: 8 }).map((_, cardIndex) => (
        <article key={`loading-grid-${cardIndex}`} className="broker-data-table__grid-card">
          <div className="broker-data-table__grid-card-cover animate-pulse bg-muted" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />
          </div>
        </article>
      ))}
    </div>
  )
}

function EmptyCardState({ message }: { message: ReactNode }) {
  return (
    <div className="flex h-24 items-center justify-center px-3 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

function SortIcon({ sort, columnId }: { sort?: DataTableSort | null; columnId: string }) {
  if (!sort || sort.id !== columnId) {
    return <ArrowUpDown className="size-3.5 opacity-50" aria-hidden />
  }
  return sort.direction === 'asc' ? (
    <ArrowUp className="size-3.5" aria-hidden />
  ) : (
    <ArrowDown className="size-3.5" aria-hidden />
  )
}

function nextSort(current: DataTableSort | null | undefined, columnId: string): DataTableSort | null {
  if (!current || current.id !== columnId) {
    return { id: columnId, direction: 'asc' }
  }
  if (current.direction === 'asc') {
    return { id: columnId, direction: 'desc' }
  }
  return null
}

function DataTableRowsView<TData>({
  columns,
  pageData,
  isLoading,
  showEmptyState,
  emptyMessage,
  getRowId,
  onRowClick,
  rowClassName,
  renderRow,
  sort,
  onSortChange,
}: {
  columns: ColumnDef<TData>[]
  pageData: TData[]
  isLoading: boolean
  showEmptyState: boolean
  emptyMessage: ReactNode
  getRowId?: (row: TData) => string
  onRowClick?: (row: TData) => void
  rowClassName?: string | ((row: TData) => string | undefined)
  renderRow?: (row: TData, context: { index: number; columns: ColumnDef<TData>[] }) => ReactNode
  sort?: DataTableSort | null
  onSortChange?: (sort: DataTableSort | null) => void
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => {
            const canSort = Boolean(column.sortable && onSortChange)
            return (
              <TableHead
                key={column.id}
                data-column={column.id}
                className={cn(
                  alignClassName[column.align ?? 'left'],
                  columnVisibilityClass(column),
                  column.className,
                )}
                aria-sort={
                  canSort && sort?.id === column.id
                    ? sort.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                {canSort ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                    onClick={() => onSortChange?.(nextSort(sort, column.id))}
                  >
                    {column.header}
                    <SortIcon sort={sort} columnId={column.id} />
                  </button>
                ) : (
                  column.header
                )}
              </TableHead>
            )
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <LoadingRows columns={columns} />
        ) : showEmptyState ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          pageData.map((row, index) => {
            if (renderRow) {
              return (
                <FragmentOrNode key={resolveRowId(row, index, getRowId)}>
                  {renderRow(row, { index, columns })}
                </FragmentOrNode>
              )
            }
            const resolvedClassName =
              typeof rowClassName === 'function' ? rowClassName(row) : rowClassName
            return (
              <DataTableRow
                key={resolveRowId(row, index, getRowId)}
                row={row}
                columns={columns}
                className={resolvedClassName}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              />
            )
          })
        )}
      </TableBody>
    </Table>
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
  onRowClick,
  rowClassName,
  renderRow,
  sort,
  onSortChange,
  views,
}: DataTableProps<TData>) {
  const hasViewToggle = Boolean(views?.includes('rows') && views?.includes('cards'))
  const [view, setView] = useState<DataTableView>('rows')

  const isClientPagination = pagination?.total === undefined
  const total = pagination?.total ?? data.length
  const pageSize = pagination?.pageSize ?? PAGE_SIZE
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(pagination?.page ?? 1, 1), totalPages)
  const pageData = useMemo(() => {
    if (!isClientPagination) {
      return data
    }

    const start = (safePage - 1) * pageSize
    return data.slice(start, start + pageSize)
  }, [data, isClientPagination, pageSize, safePage])

  const { dataColumns, actionsColumn, imageColumn, gridFields } = useMemo(() => {
    const actions = columns.find((column) => column.id === 'actions')
    const image = columns.find((column) => column.id === 'image')
    const dataCols = columns.filter((column) => column.id !== 'actions')
    const fields = dataCols.filter(
      (column) => column.id !== 'image' && !column.hideInCard,
    )
    return {
      dataColumns: dataCols,
      actionsColumn: actions,
      imageColumn: image,
      gridFields: fields,
    }
  }, [columns])

  const paginationBar = {
    ...pagination,
    page: safePage,
    total,
  }
  const showEmptyState = !isLoading && data.length === 0
  const resolvedEmptyMessage = emptyMessage
  const activeView = hasViewToggle ? view : 'rows'

  const table = (
    <div className={cn('broker-data-table', className)}>
      {hasViewToggle ? (
        activeView === 'cards' ? (
          isLoading ? (
            <LoadingCardGrid />
          ) : showEmptyState ? (
            <EmptyCardState message={resolvedEmptyMessage} />
          ) : (
            <DataTableCardGrid
              rows={pageData}
              columns={gridFields}
              imageColumn={imageColumn}
              actionsColumn={actionsColumn}
              getRowId={getRowId}
              onRowClick={onRowClick}
              rowClassName={rowClassName}
            />
          )
        ) : (
          <DataTableRowsView
            columns={columns}
            pageData={pageData}
            isLoading={isLoading}
            showEmptyState={showEmptyState}
            emptyMessage={resolvedEmptyMessage}
            getRowId={getRowId}
            onRowClick={onRowClick}
            rowClassName={rowClassName}
            renderRow={renderRow}
            sort={sort}
            onSortChange={onSortChange}
          />
        )
      ) : (
        <>
          <div className="sm:hidden">
            {isLoading ? (
              <div className="divide-y divide-surface-container-high">
                <LoadingCards columns={columns} />
              </div>
            ) : showEmptyState ? (
              <EmptyCardState message={resolvedEmptyMessage} />
            ) : (
              <DataTableCards
                rows={pageData}
                columns={dataColumns}
                actionsColumn={actionsColumn}
                getRowId={getRowId}
                onRowClick={onRowClick}
                rowClassName={rowClassName}
              />
            )}
          </div>

          <div className="hidden sm:block">
            <DataTableRowsView
              columns={columns}
              pageData={pageData}
              isLoading={isLoading}
              showEmptyState={showEmptyState}
              emptyMessage={resolvedEmptyMessage}
              getRowId={getRowId}
              onRowClick={onRowClick}
              rowClassName={rowClassName}
              renderRow={renderRow}
              sort={sort}
              onSortChange={onSortChange}
            />
          </div>
        </>
      )}

      {pagination ? (
        <DataTablePaginationBar {...paginationBar} onPageChange={pagination.onPageChange} />
      ) : null}
    </div>
  )

  if (!hasViewToggle || !views) {
    return table
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <DataTableViewToggle value={view} onChange={setView} views={views} />
      </div>
      {table}
    </div>
  )
}

function FragmentOrNode({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export { DataTablePaginationBar } from './pagination'
export { DataTableViewToggle } from './view-toggle'
