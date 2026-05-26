import type { ReactNode } from 'react'

export const ColumnType = {
  Text: 'text',
  Date: 'date',
  DateTime: 'datetime',
  Number: 'number',
  Boolean: 'boolean',
} as const

export type ColumnType = (typeof ColumnType)[keyof typeof ColumnType]

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
  pageSize?: number
  total?: number
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
