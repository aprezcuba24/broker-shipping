import type { ReactNode } from 'react'

export enum ColumnType {
  Text = 'text',
  Date = 'date',
  DateTime = 'datetime',
  Number = 'number',
  Boolean = 'boolean',
}

export type ColumnDef<TData> = {
  id: string
  header: ReactNode
  accessor?: keyof TData & string
  type?: ColumnType
  align?: 'left' | 'center' | 'right'
  className?: string
  cell?: (row: TData) => ReactNode
}

export type DataTablePagination = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export type DataTableProps<TData> = {
  columns: ColumnDef<TData>[]
  data: TData[]
  pagination: DataTablePagination
  getRowId?: (row: TData) => string
  isLoading?: boolean
  emptyMessage?: ReactNode
  className?: string
}
